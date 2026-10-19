import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetMailer } from './mail/password-reset-mailer';
import {
  hashResetToken,
  INVALID_RESET_TOKEN,
  PasswordResetService,
} from './password-reset.service';

// @nestjs/config é ESM e o Jest unitário não o transforma; aqui só precisamos
// do token de injeção.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

type MailArg = { token: string; expiresAt: Date; to: string };

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  const tokensRepo = { findOne: jest.fn() };
  const users = { findByEmail: jest.fn(), updatePasswordHash: jest.fn() };
  const mailer = { sendPasswordReset: jest.fn<Promise<void>, [MailArg]>() };
  const config = { get: jest.fn() };
  const manager = {
    delete: jest.fn(),
    create: jest.fn((_e: unknown, data: object) => ({ ...data })),
    save: jest.fn(),
    update: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((cb: (m: typeof manager) => Promise<unknown>) =>
      cb(manager),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mailer.sendPasswordReset.mockResolvedValue(undefined);
    config.get.mockReturnValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: tokensRepo,
        },
        { provide: UsersService, useValue: users },
        { provide: PasswordResetMailer, useValue: mailer },
        { provide: ConfigService, useValue: config },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(PasswordResetService);
  });

  describe('forgotPassword', () => {
    it('e-mail inexistente: não grava token nem envia e-mail', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.forgotPassword('x@x.com')).resolves.toBeUndefined();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('e-mail existente: grava só o hash, com expiração, e envia o token', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'u1',
        nome: 'Maria',
        email: 'maria@example.com',
      });
      const before = Date.now();
      await service.forgotPassword('maria@example.com');

      const sent = mailer.sendPasswordReset.mock.calls[0][0];
      const saved = (manager.create.mock.calls[0] as unknown[])[1] as {
        tokenHash: string;
        expiresAt: Date;
        usuarioId: string;
      };
      expect(sent.token.length).toBeGreaterThanOrEqual(43);
      expect(saved.tokenHash).toBe(hashResetToken(sent.token));
      expect(saved.tokenHash).not.toBe(sent.token);
      expect(saved.usuarioId).toBe('u1');
      expect(saved.expiresAt.getTime() - before).toBeGreaterThan(29 * 60_000);
      expect(manager.delete).toHaveBeenCalledWith(PasswordResetToken, {
        usuarioId: 'u1',
      });
    });

    it('falha no envio do e-mail não quebra a resposta', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@a.com' });
      mailer.sendPasswordReset.mockRejectedValue(new Error('smtp fora'));
      await expect(service.forgotPassword('a@a.com')).resolves.toBeUndefined();
    });

    it('respeita PASSWORD_RESET_TOKEN_TTL_MINUTES', async () => {
      config.get.mockReturnValue('5');
      users.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@a.com' });
      const before = Date.now();
      await service.forgotPassword('a@a.com');
      const { expiresAt } = (manager.create.mock.calls[0] as unknown[])[1] as {
        expiresAt: Date;
      };
      expect(expiresAt.getTime() - before).toBeLessThanOrEqual(
        5 * 60_000 + 1000,
      );
    });
  });

  describe('resetPassword', () => {
    const valid = {
      id: 't1',
      usuarioId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('token válido: consome o token e troca o hash (nunca a senha pura)', async () => {
      tokensRepo.findOne.mockResolvedValue(valid);
      manager.update.mockResolvedValue({ affected: 1 });
      await service.resetPassword('tok', 'nova-senha-123');

      const args = users.updatePasswordHash.mock.calls[0] as unknown[];
      expect(args[0]).toBe('u1');
      expect(args[1]).not.toBe('nova-senha-123');
      expect(String(args[1]).startsWith('$2')).toBe(true);
      expect(args[2]).toBe(manager);
    });

    it('perde a corrida (UPDATE afetou 0 linhas): 400 e a senha não muda', async () => {
      tokensRepo.findOne.mockResolvedValue(valid);
      manager.update.mockResolvedValue({ affected: 0 });
      await expect(
        service.resetPassword('tok', 'nova-senha-123'),
      ).rejects.toThrow(new BadRequestException(INVALID_RESET_TOKEN));
      expect(users.updatePasswordHash).not.toHaveBeenCalled();
    });

    it.each([
      ['inexistente', null],
      ['já usado', { ...valid, usedAt: new Date() }],
      ['expirado', { ...valid, expiresAt: new Date(Date.now() - 1) }],
    ])('token %s: 400 sem alterar nada', async (_n, record) => {
      tokensRepo.findOne.mockResolvedValue(record);
      await expect(
        service.resetPassword('tok', 'nova-senha-123'),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(users.updatePasswordHash).not.toHaveBeenCalled();
    });
  });
});
