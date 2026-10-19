import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { EmailAlreadyExistsException } from '../../common/exceptions';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { Perfil } from './entities/perfil.entity';
import { TipoDiabetes } from './enums/tipo-diabetes.enum';

// NÃO é o CreateUserDto da API: a senha já chega como hash (quem faz o hash
// é o AuthService), então texto puro de senha nunca passa por este módulo.

export interface CreatePerfilData {
  dataNascimento: string;
  tipoDiabetes: TipoDiabetes;
  alturaCm: number;
  pesoKg: number;
  contatoEmergencia: { nome: string; relacao: string; telefone: string };
}

export interface CreateUserData {
  nome: string;
  email: string;
  senhaHash: string;
  perfil: CreatePerfilData;
}

// Violação de UNIQUE: MySQL (produção) e SQLite (testes e2e).
const UNIQUE_VIOLATION_CODES = [
  'ER_DUP_ENTRY',
  'SQLITE_CONSTRAINT',
  'SQLITE_CONSTRAINT_UNIQUE',
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const code = (error.driverError as { code?: string } | undefined)?.code;
  return code !== undefined && UNIQUE_VIOLATION_CODES.includes(code);
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // Uso interno. Não traz senhaHash (coluna com select: false).
  async findById(id: string): Promise<User | null> {
    // Guarda obrigatória: no TypeORM, where: { id: undefined } ignora o
    // filtro e devolve o PRIMEIRO usuário da tabela.
    if (!id) return null;
    return this.usersRepository.findOne({ where: { id } });
  }

  // Usuário + perfil para GET /users/me. Não traz senhaHash.
  async findByIdWithPerfil(id: string): Promise<User | null> {
    if (!id) return null; // mesma guarda de findById
    return this.usersRepository.findOne({
      where: { id },
      relations: { perfil: true },
    });
  }

  // Uso interno. Não traz senhaHash.
  async findByEmail(email: string): Promise<User | null> {
    if (!email?.trim()) return null;
    return this.usersRepository.findOne({
      where: { email: normalizeEmail(email) },
    });
  }

  // Uso interno, só para o login: único método que carrega senhaHash.
  // O resultado nunca deve ser devolvido ao cliente.
  async findByEmailWithPassword(email: string): Promise<User | null> {
    if (!email?.trim()) return null;
    return this.usersRepository.findOne({
      where: { email: normalizeEmail(email) },
      select: { id: true, nome: true, email: true, senhaHash: true },
    });
  }

  // Troca o hash da senha (fluxo de redefinição). Recebe só o hash; aceita o
  // EntityManager da transação do chamador.
  async updatePasswordHash(
    userId: string,
    senhaHash: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (!userId) return; // update com id vazio poderia atingir todas as linhas
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    await repo.update({ id: userId }, { senhaHash });
  }

  // Chamado pelo AuthService no cadastro. Devolve só os campos públicos.
  async create(data: CreateUserData): Promise<UserResponseDto> {
    const email = normalizeEmail(data.email);

    if (await this.usersRepository.existsBy({ email })) {
      throw new EmailAlreadyExistsException(email);
    }

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            nome: data.nome.trim(),
            email,
            senhaHash: data.senhaHash,
          }),
        );

        const { perfil } = data;
        user.perfil = await manager.save(
          manager.create(Perfil, {
            user,
            dataNascimento: perfil.dataNascimento,
            tipoDiabetes: perfil.tipoDiabetes,
            alturaCm: perfil.alturaCm,
            pesoKg: perfil.pesoKg,
            contatoEmergenciaNome: perfil.contatoEmergencia.nome,
            contatoEmergenciaRelacao: perfil.contatoEmergencia.relacao,
            contatoEmergenciaTelefone: perfil.contatoEmergencia.telefone,
          }),
        );
        return user;
      });
      return toUserResponse(saved);
    } catch (error) {
      // Corrida entre dois cadastros: o índice UNIQUE do banco é a garantia final
      // (a transação já foi revertida).
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyExistsException(email);
      }
      throw error;
    }
  }
}
