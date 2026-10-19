import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { TipoDiabetes } from '../users/enums/tipo-diabetes.enum';
import { UsersService } from '../users/users.service';
import { AuthService, INVALID_CREDENTIALS } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  const users = { create: jest.fn(), findByEmailWithPassword: jest.fn() };
  const jwt = { sign: jest.fn().mockReturnValue('token-jwt') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    const dto: RegisterDto = {
      nome: 'Maria Silva',
      email: 'maria@example.com',
      senha: 'senha-forte-123',
      confirmarSenha: 'senha-forte-123',
      dataNascimento: '1995-04-12',
      tipoDiabetes: TipoDiabetes.TIPO_2,
      alturaCm: 170.5,
      pesoKg: 68.3,
      contatoEmergencia: {
        nome: 'João',
        relacao: 'Pai',
        telefone: '41999999999',
      },
    };

    it('repassa só o hash (nunca a senha nem confirmarSenha) ao UsersService', async () => {
      users.create.mockResolvedValue({ id: 'uuid-1' });
      await service.register(dto);

      const calls = users.create.mock.calls as unknown[][];
      const arg = calls[0][0] as Record<string, unknown>;
      expect(arg).not.toHaveProperty('senha');
      expect(arg).not.toHaveProperty('confirmarSenha');
      expect(arg.senhaHash).not.toBe(dto.senha);
      await expect(
        bcrypt.compare(dto.senha, arg.senhaHash as string),
      ).resolves.toBe(true);
      expect(arg.perfil).toEqual({
        dataNascimento: '1995-04-12',
        tipoDiabetes: TipoDiabetes.TIPO_2,
        alturaCm: 170.5,
        pesoKg: 68.3,
        contatoEmergencia: dto.contatoEmergencia,
      });
    });
  });

  describe('login', () => {
    const senha = 'senha-forte-123';
    let senhaHash: string;
    beforeAll(async () => {
      senhaHash = await bcrypt.hash(senha, 4);
    });

    it('credenciais válidas: devolve token e dados mínimos, sem hash', async () => {
      users.findByEmailWithPassword.mockResolvedValue({
        id: 'uuid-1',
        nome: 'Maria',
        email: 'maria@example.com',
        senhaHash,
      });
      const result = await service.login({ email: 'maria@example.com', senha });

      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'uuid-1' });
      expect(result).toEqual({
        accessToken: 'token-jwt',
        user: { id: 'uuid-1', nome: 'Maria', email: 'maria@example.com' },
      });
      expect(JSON.stringify(result)).not.toContain(senhaHash);
    });

    it('senha inválida: 401 com mensagem genérica', async () => {
      users.findByEmailWithPassword.mockResolvedValue({ id: 'u', senhaHash });
      const err = await service
        .login({ email: 'maria@example.com', senha: 'errada-123' })
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).message).toBe(INVALID_CREDENTIALS);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('usuário inexistente: mesma resposta da senha inválida', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);
      const err = await service
        .login({ email: 'ninguem@example.com', senha })
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).message).toBe(INVALID_CREDENTIALS);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
