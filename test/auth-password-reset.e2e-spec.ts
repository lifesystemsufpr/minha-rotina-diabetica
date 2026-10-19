import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../src/modules/auth/entities/password-reset-token.entity';
import {
  PasswordResetMailData,
  PasswordResetMailer,
} from '../src/modules/auth/mail/password-reset-mailer';
import {
  FORGOT_PASSWORD_MESSAGE,
  hashResetToken,
} from '../src/modules/auth/password-reset.service';
import { User } from '../src/modules/users/entities/user.entity';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

describe('Recuperação de senha (e2e)', () => {
  let app: INestApplication<App>;
  let tokens: Repository<PasswordResetToken>;
  let users: Repository<User>;
  const email = 'reset@example.com';
  const senhaAntiga = 'senha-antiga-123';
  const senhaNova = 'senha-nova-456';
  let sent: PasswordResetMailData[];

  const forgot = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send(body as object);
  const reset = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send(body as object);
  const login = (senha: string) =>
    request(app.getHttpServer()).post('/api/auth/login').send({ email, senha });
  const requestToken = async (): Promise<string> => {
    sent.length = 0;
    await forgot({ email }).expect(200);
    return sent[sent.length - 1].token;
  };

  beforeAll(async () => {
    app = await createTestApp();
    tokens = app.get(getRepositoryToken(PasswordResetToken));
    users = app.get(getRepositoryToken(User));
    // Captura o que seria enviado por e-mail (sem enviar nada)
    sent = [];
    jest
      .spyOn(app.get(PasswordResetMailer), 'sendPasswordReset')
      .mockImplementation((data) => {
        sent.push(data);
        return Promise.resolve();
      });
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegisterPayload({ email, senha: senhaAntiga }))
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sent.length = 0;
  });

  describe('POST /auth/forgot-password', () => {
    it.each([
      ['e-mail inválido', { email: 'nao-e-email' }],
      ['e-mail ausente', {}],
      ['e-mail não-string', { email: { $ne: '' } }],
      ['propriedade extra', { email, admin: true }],
    ])('%s: 400', async (_n, body) => {
      await forgot(body).expect(400);
    });

    it('e-mail cadastrado e não cadastrado: respostas idênticas', async () => {
      const known = await forgot({ email }).expect(200);
      const unknown = await forgot({ email: 'ninguem@example.com' }).expect(
        200,
      );
      expect(known.body).toEqual({ message: FORGOT_PASSWORD_MESSAGE });
      expect(unknown.body).toEqual(known.body);
    });

    it('só envia e cria token quando a conta existe', async () => {
      await forgot({ email: 'ninguem@example.com' }).expect(200);
      expect(sent).toHaveLength(0);
      await forgot({ email }).expect(200);
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe(email);
    });

    it('token tem expiração, é guardado só como hash e a senha não vaza', async () => {
      const before = Date.now();
      const token = await requestToken();
      const row = await tokens.findOneByOrFail({
        tokenHash: hashResetToken(token),
      });
      expect(row.tokenHash).not.toBe(token);
      expect(row.usedAt).toBeNull();
      const ttl = row.expiresAt.getTime() - before;
      expect(ttl).toBeGreaterThan(29 * 60_000);
      expect(ttl).toBeLessThanOrEqual(30 * 60_000 + 5_000);
      expect(JSON.stringify(sent)).not.toContain(senhaAntiga);
      expect(await tokens.findOneBy({ tokenHash: token })).toBeNull();
    });

    it('nova solicitação invalida o token anterior', async () => {
      const first = await requestToken();
      const second = await requestToken();
      await reset({ token: first, novaSenha: senhaNova }).expect(400);
      await reset({ token: second, novaSenha: senhaAntiga }).expect(200);
    });
  });

  describe('POST /auth/reset-password', () => {
    it.each([
      ['token ausente', { novaSenha: senhaNova }],
      ['senha ausente', { token: 'abc' }],
      ['senha curta', { token: 'abc', novaSenha: '123' }],
      ['senha > 72', { token: 'abc', novaSenha: 'a'.repeat(73) }],
      ['senha sem números', { token: 'abc', novaSenha: 'somenteletras' }],
      ['propriedade extra', { token: 'abc', novaSenha: senhaNova, x: 1 }],
    ])('payload inválido (%s): 400', async (_n, body) => {
      await reset(body).expect(400);
    });

    it('token inexistente: 400 e nada muda', async () => {
      await reset({
        token: 'token-que-nao-existe',
        novaSenha: senhaNova,
      }).expect(400);
      await login(senhaNova).expect(401);
      await login(senhaAntiga).expect(200);
    });

    it('token expirado: 400 e a senha não muda', async () => {
      const token = await requestToken();
      await tokens.update(
        { tokenHash: hashResetToken(token) },
        { expiresAt: new Date(Date.now() - 1000) },
      );
      await reset({ token, novaSenha: senhaNova }).expect(400);
      await login(senhaNova).expect(401);
      await login(senhaAntiga).expect(200);
    });

    it('token válido altera a senha; login funciona só com a nova', async () => {
      const token = await requestToken();
      const res = await reset({ token, novaSenha: senhaNova }).expect(200);
      expect(res.body).toEqual({ message: 'Senha redefinida com sucesso.' });
      await login(senhaNova).expect(200);
      await login(senhaAntiga).expect(401);

      const row = await tokens.findOneByOrFail({
        tokenHash: hashResetToken(token),
      });
      expect(row.usedAt).not.toBeNull();
      const saved = await users.findOneOrFail({
        where: { email },
        select: { id: true, senhaHash: true },
      });
      expect(saved.senhaHash.startsWith('$2')).toBe(true);
      expect(saved.senhaHash).not.toContain(senhaNova);
    });

    it('token reutilizado: 400 e a senha não muda de novo', async () => {
      const token = await requestToken();
      await reset({ token, novaSenha: 'outra-senha-789' }).expect(200);
      await reset({ token, novaSenha: 'terceira-senha-000' }).expect(400);
      await login('outra-senha-789').expect(200);
      await login('terceira-senha-000').expect(401);
    });

    it('resposta de token inválido/expirado/usado é a mesma mensagem', async () => {
      const bad = await reset({ token: 'x'.repeat(30), novaSenha: senhaNova });
      expect((bad.body as { message: string }).message).toBe(
        'Token inválido ou expirado',
      );
    });
  });
});
