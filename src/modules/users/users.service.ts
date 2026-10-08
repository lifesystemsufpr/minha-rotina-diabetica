import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { EmailAlreadyExistsException } from '../../common/exceptions';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

// NÃO é o CreateUserDto da API: a senha já chega como hash (quem faz o hash
// é o AuthService), então texto puro de senha nunca passa por este módulo.
export interface CreateUserData {
  nome: string;
  email: string;
  senhaHash: string;
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
  ) {}

  // Uso interno. Não traz senhaHash (coluna com select: false).
  async findById(id: string): Promise<User | null> {
    // Guarda obrigatória: no TypeORM, where: { id: undefined } ignora o
    // filtro e devolve o PRIMEIRO usuário da tabela.
    if (!id) return null;
    return this.usersRepository.findOne({ where: { id } });
  }

  // Uso interno. Não traz senhaHash.
  async findByEmail(email: string): Promise<User | null> {
    if (!email?.trim()) return null;
    return this.usersRepository.findOne({
      where: { email: normalizeEmail(email) },
    });
  }

  // Uso interno, só para o login: único método que carrega senhaHash.
  // Traz também `ativo`, para o login recusar conta excluída.
  // O resultado nunca deve ser devolvido ao cliente.
  async findByEmailWithPassword(email: string): Promise<User | null> {
    if (!email?.trim()) return null;
    return this.usersRepository.findOne({
      where: { email: normalizeEmail(email) },
      select: {
        id: true,
        nome: true,
        email: true,
        senhaHash: true,
        ativo: true,
      },
    });
  }

  // Chamado pelo AuthService no cadastro. Devolve só os campos públicos.
  async create(data: CreateUserData): Promise<UserResponseDto> {
    const email = normalizeEmail(data.email);

    if (await this.usersRepository.existsBy({ email })) {
      throw new EmailAlreadyExistsException(email);
    }

    try {
      const saved = await this.usersRepository.save(
        this.usersRepository.create({
          nome: data.nome.trim(),
          email,
          senhaHash: data.senhaHash,
        }),
      );
      return toUserResponse(saved);
    } catch (error) {
      // Dois cadastros simultâneos podem passar pelo existsBy; o índice
      // UNIQUE do banco é a garantia final.
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyExistsException(email);
      }
      throw error;
    }
  }

  async deleteAccount(usuarioId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: usuarioId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.ativo) {
      throw new ConflictException('Esta conta já está inativa.');
    }

    user.ativo = false;
    await this.usersRepository.save(user);
  }
}
