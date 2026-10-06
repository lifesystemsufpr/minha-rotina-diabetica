import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getMetadataArgsStorage, QueryFailedError } from 'typeorm';
import { EmailAlreadyExistsException } from '../../common/exceptions';
import { toUserResponse } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    existsBy: jest.fn(),
    create: jest.fn((data: Partial<User>) => ({ ...data })),
    save: jest.fn(),
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
        select: { id: true, nome: true, email: true, senhaHash: true },
      });
    });
  });

  describe('create', () => {
    const data = {
      nome: '  Maria Silva ',
      email: ' Maria@Example.com ',
      senhaHash: 'hash-secreto',
    };

    it('cria o usuário com e-mail normalizado e NÃO devolve senhaHash', async () => {
      repo.existsBy.mockResolvedValue(false);
      repo.save.mockResolvedValue(savedUser);

      const result = await service.create(data);

      expect(repo.create).toHaveBeenCalledWith({
        nome: 'Maria Silva',
        email: 'maria@example.com',
        senhaHash: 'hash-secreto',
      });
      expect(result).toEqual({
        id: 'uuid-1',
        nome: 'Maria Silva',
        email: 'maria@example.com',
        createdAt: savedUser.createdAt,
      });
      expect(result).not.toHaveProperty('senhaHash');
    });

    it('lança EmailAlreadyExistsException se o e-mail já existe', async () => {
      repo.existsBy.mockResolvedValue(true);
      await expect(service.create(data)).rejects.toBeInstanceOf(
        EmailAlreadyExistsException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('converte violação de UNIQUE (corrida) em EmailAlreadyExistsException', async () => {
      repo.existsBy.mockResolvedValue(false);
      repo.save.mockRejectedValue(
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

    it('repassa erros inesperados sem mascarar', async () => {
      repo.existsBy.mockResolvedValue(false);
      repo.save.mockRejectedValue(new Error('conexão perdida'));
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
