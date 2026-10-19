import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, getMetadataArgsStorage, QueryFailedError } from 'typeorm';
import { EmailAlreadyExistsException } from '../../common/exceptions';
import { toUserResponse } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Perfil } from './entities/perfil.entity';
import { TipoDiabetes } from './enums/tipo-diabetes.enum';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    existsBy: jest.fn(),
    update: jest.fn(),
    create: jest.fn((data: Partial<User>) => ({ ...data })),
    save: jest.fn(),
  };

  const manager = {
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((cb: (m: typeof manager) => Promise<unknown>) =>
      cb(manager),
    ),
  };

  const savedUser = {
    id: 'uuid-1',
    nome: 'Maria Silva',
    email: 'maria@example.com',
    senhaHash: 'hash-secreto',
    createdAt: new Date('2026-10-03T12:00:00.000Z'),
    updatedAt: new Date('2026-10-03T12:00:00.000Z'),
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('findById', () => {
    it('retorna o usuário encontrado', async () => {
      repo.findOne.mockResolvedValue(savedUser);
      await expect(service.findById('uuid-1')).resolves.toBe(savedUser);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
    });

    it('retorna null quando não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('nao-existe')).resolves.toBeNull();
    });

    it('não consulta o banco com id vazio (evita devolver o 1º usuário)', async () => {
      await expect(service.findById('')).resolves.toBeNull();
      await expect(
        service.findById(undefined as unknown as string),
      ).resolves.toBeNull();
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findByIdWithPerfil', () => {
    it('carrega o perfil junto e filtra só pelo id informado', async () => {
      repo.findOne.mockResolvedValue(savedUser);
      await service.findByIdWithPerfil('uuid-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: { perfil: true },
      });
    });

    it('não consulta o banco com id vazio', async () => {
      await expect(service.findByIdWithPerfil('')).resolves.toBeNull();
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updatePasswordHash', () => {
    it('atualiza só o usuário informado', async () => {
      await service.updatePasswordHash('uuid-1', 'novo-hash');
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { senhaHash: 'novo-hash' },
      );
    });

    it('não faz update com id vazio (evita atingir todas as linhas)', async () => {
      await service.updatePasswordHash('', 'novo-hash');
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('normaliza o e-mail (trim + minúsculas) antes de buscar', async () => {
      repo.findOne.mockResolvedValue(savedUser);
      await service.findByEmail('  Maria@Example.COM ');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'maria@example.com' },
      });
    });

    it('não consulta o banco com e-mail vazio', async () => {
      await expect(service.findByEmail('   ')).resolves.toBeNull();
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('pede senhaHash explicitamente no select', async () => {
      repo.findOne.mockResolvedValue(savedUser);
      await service.findByEmailWithPassword('maria@example.com');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'maria@example.com' },
        select: {
          id: true,
          nome: true,
          email: true,
          senhaHash: true,
          ativo: true,
        },
      });
    });
  });

  describe('create', () => {
    const data = {
      nome: '  Maria Silva ',
      email: ' Maria@Example.com ',
      senhaHash: 'hash-secreto',
      perfil: {
        dataNascimento: '1995-04-12',
        tipoDiabetes: TipoDiabetes.TIPO_1,
        alturaCm: 170.5,
        pesoKg: 68.3,
        contatoEmergencia: {
          nome: 'João Silva',
          relacao: 'Pai',
          telefone: '(41) 99999-9999',
        },
      },
    };
    const savedPerfil = {
      dataNascimento: '1995-04-12',
      tipoDiabetes: TipoDiabetes.TIPO_1,
      alturaCm: 170.5,
      pesoKg: 68.3,
      contatoEmergenciaNome: 'João Silva',
      contatoEmergenciaRelacao: 'Pai',
      contatoEmergenciaTelefone: '(41) 99999-9999',
    } as Perfil;

    it('cria Usuario e Perfil na mesma transação e NÃO devolve senhaHash', async () => {
      repo.existsBy.mockResolvedValue(false);
      manager.save
        .mockResolvedValueOnce({ ...savedUser })
        .mockResolvedValueOnce(savedPerfil);

      const result = await service.create(data);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.create).toHaveBeenNthCalledWith(1, User, {
        nome: 'Maria Silva',
        email: 'maria@example.com',
        senhaHash: 'hash-secreto',
      });
      expect(manager.create).toHaveBeenNthCalledWith(
        2,
        Perfil,
        expect.objectContaining({
          user: expect.objectContaining({ id: 'uuid-1' }) as unknown,
          tipoDiabetes: TipoDiabetes.TIPO_1,
          alturaCm: 170.5,
          pesoKg: 68.3,
          contatoEmergenciaNome: 'João Silva',
          contatoEmergenciaRelacao: 'Pai',
          contatoEmergenciaTelefone: '(41) 99999-9999',
        }),
      );
      expect(result.email).toBe('maria@example.com');
      expect(result.perfil?.contatoEmergencia.nome).toBe('João Silva');
      expect(JSON.stringify(result)).not.toContain('hash-secreto');
      expect(result).not.toHaveProperty('senhaHash');
    });

    it('lança EmailAlreadyExistsException se o e-mail já existe', async () => {
      repo.existsBy.mockResolvedValue(true);
      await expect(service.create(data)).rejects.toBeInstanceOf(
        EmailAlreadyExistsException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('converte violação de UNIQUE (corrida) em EmailAlreadyExistsException', async () => {
      repo.existsBy.mockResolvedValue(false);
      manager.save.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }),
        ),
      );
      await expect(service.create(data)).rejects.toBeInstanceOf(
        EmailAlreadyExistsException,
      );
    });

    it('repassa erros inesperados sem mascarar (transação é revertida)', async () => {
      repo.existsBy.mockResolvedValue(false);
      manager.save.mockRejectedValue(new Error('conexão perdida'));
      await expect(service.create(data)).rejects.toThrow('conexão perdida');
    });
  });

  describe('exposição pública', () => {
    it('toUserResponse nunca inclui senhaHash', () => {
      expect(toUserResponse(savedUser)).not.toHaveProperty('senhaHash');
      expect(Object.keys(toUserResponse(savedUser)).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'nome',
      ]);
    });

    it('a coluna senhaHash está marcada com select: false', () => {
      const column = getMetadataArgsStorage().columns.find(
        (c) => c.target === User && c.propertyName === 'senhaHash',
      );
      expect(column?.options.select).toBe(false);
    });
  });
});
