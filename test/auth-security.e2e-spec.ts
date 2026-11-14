import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { UsersService } from '../src/modules/users/users.service';
import { AuthRateLimitService } from '../src/modules/auth/auth-rate-limit.service';
import { AuthRatePolicy } from '../src/modules/auth/auth-rate-policy';
import { AuthRateBucket } from '../src/modules/auth/entities/auth-rate-bucket.entity';
import { PasswordResetToken } from '../src/modules/auth/entities/password-reset-token.entity';
import {
  PasswordResetMailer,
  PasswordResetMailData,
} from '../src/modules/auth/mail/password-reset-mailer';
import { User } from '../src/modules/users/entities/user.entity';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

const policy: AuthRatePolicy = {
  windowSeconds: 60,
  loginIp: 3,
  loginAccount: 2,
  forgotIp: 3,
  forgotAccount: 2,
  resetIp: 2,
};

describe('Proteção de autenticação (e2e)', () => {
  let app: INestApplication<App>;
  let buckets: Repository<AuthRateBucket>;
  let users: Repository<User>;
  let sent: PasswordResetMailData[];
  const email = 'security@example.test';
  const password = 'synthetic-password-123';
  const login = (address = email, senha = password) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: address, senha });
  const forgot = (address = email) =>
    request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: address });
  const reset = (token: string, novaSenha = password) =>
    request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, novaSenha });
  const me = (token: string) =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .auth(token, { type: 'bearer' });

  beforeAll(async () => {
    app = await createTestApp([], policy);
    buckets = app.get(getRepositoryToken(AuthRateBucket));
    users = app.get(getRepositoryToken(User));
    sent = [];
    jest
      .spyOn(app.get(PasswordResetMailer), 'sendPasswordReset')
      .mockImplementation((data) => {
        sent.push(data);
        return Promise.resolve();
      });
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegisterPayload({ email, senha: password }))
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(
        validRegisterPayload({
          email: 'other-security@example.test',
          senha: password,
        }),
      )
      .expect(201);
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await buckets.clear();
    sent.length = 0;
  });
  afterEach(() => {
    jest.restoreAllMocks();
    // restoreAllMocks restaura também o transporte; reinstala a captura sem SMTP.
    jest
      .spyOn(app.get(PasswordResetMailer), 'sendPasswordReset')
      .mockImplementation((data) => {
        sent.push(data);
        return Promise.resolve();
      });
  });

  it('limita login por conta normalizada e informa Retry-After sem revelar a conta', async () => {
    await login(' absent@example.test ', 'wrong-123').expect(401);
    await login('ABSENT@EXAMPLE.TEST', 'wrong-123').expect(401);
    const response = await login('absent@example.test', 'wrong-123').expect(
      429,
    );
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(Number(response.headers['retry-after'])).toBeLessThanOrEqual(60);
    expect(response.body).toMatchObject({
      statusCode: 429,
      error: 'Too Many Requests',
      path: '/api/auth/login',
    });
    expect(JSON.stringify(response.body)).not.toContain('absent');
  });
  it('login bem-sucedido também consome orçamento, sem zerar a proteção', async () => {
    await login().expect(200);
    await login().expect(200);
    await login().expect(429);
  });
  it('limite por IP cobre contas diferentes e não confia em X-Forwarded-For', async () => {
    for (let i = 0; i < 3; i++)
      await login(`absent${i}@example.test`, 'wrong-123')
        .set('X-Forwarded-For', `203.0.113.${i + 1}`)
        .expect(401);
    await login('absent4@example.test', 'wrong-123')
      .set('X-Forwarded-For', '203.0.113.200')
      .expect(429);
  });
  it('requisições simultâneas não excedem a cota do IP', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        login(`parallel${i}@example.test`, 'wrong-123'),
      ),
    );
    expect(
      responses.filter((response) => response.status === 401),
    ).toHaveLength(3);
    expect(
      responses.filter((response) => response.status === 429),
    ).toHaveLength(7);
  });
  it('recuperação limita e-mails existentes e inexistentes da mesma forma, sem enviar ao bloquear', async () => {
    for (const address of [email, 'absent@example.test']) {
      await buckets.clear();
      sent.length = 0;
      await forgot(address).expect(200);
      await forgot(address.toUpperCase()).expect(200);
      const count = sent.length;
      await forgot(address).expect(429);
      expect(sent).toHaveLength(count);
      expect(count).toBe(address === email ? 2 : 0);
    }
  });
  it('recuperação também limita por IP quando o atacante varia o e-mail', async () => {
    for (let i = 0; i < 3; i++)
      await forgot(`recipient${i}@example.test`).expect(200);
    await forgot('recipient4@example.test').expect(429);
  });
  it('redefinição conta códigos inválidos e payloads inválidos antes da validação', async () => {
    await reset('invalid-code').expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({})
      .expect(400);
    await reset('another-invalid-code').expect(429);
  });
  it('os orçamentos das três rotas são independentes', async () => {
    await login().expect(200);
    await login().expect(200);
    await login().expect(429);
    await forgot().expect(200);
    await reset('invalid-code').expect(400);
  });
  it('contadores são compartilhados entre instâncias e não persistem identificadores em texto', async () => {
    const config = app.get(ConfigService);
    const first = new AuthRateLimitService(buckets, policy, config);
    const second = new AuthRateLimitService(buckets, policy, config);
    expect(await first.consume('login', '203.0.113.10', email)).toBe(0);
    expect(await second.consume('login', '203.0.113.11', email)).toBe(0);
    expect(await first.consume('login', '203.0.113.12', email)).toBeGreaterThan(
      0,
    );
    const stored = await buckets.find();
    expect(stored.every((row) => /^[a-f0-9]{64}$/.test(row.key))).toBe(true);
    expect(JSON.stringify(stored)).not.toContain(email);
    expect(JSON.stringify(stored)).not.toContain('203.0.113');
  });
  it('nova janela libera tentativas e remove contadores expirados', async () => {
    const clock = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.UTC(2026, 10, 3, 12));
    const limiter = new AuthRateLimitService(
      buckets,
      policy,
      app.get(ConfigService),
    );
    await limiter.consume('login', 'synthetic-ip', email);
    await limiter.consume('login', 'synthetic-ip', email);
    expect(
      await limiter.consume('login', 'synthetic-ip', email),
    ).toBeGreaterThan(0);
    clock.mockReturnValue(Date.UTC(2026, 10, 3, 12, 1));
    expect(await limiter.consume('login', 'synthetic-ip', email)).toBe(0);
    expect(await buckets.count()).toBe(2);
  });
  it('reset invalida todos os JWTs anteriores e preserva a sessão de outra conta', async () => {
    const first = await login().expect(200);
    const second = await login().expect(200);
    const other = await login('other-security@example.test').expect(200);
    const oldToken = (first.body as { accessToken: string }).accessToken;
    const anotherToken = (second.body as { accessToken: string }).accessToken;
    const otherToken = (other.body as { accessToken: string }).accessToken;
    await me(oldToken).expect(200);
    await forgot().expect(200);
    await reset(sent.at(-1)!.token).expect(200);
    await me(oldToken).expect(401);
    await me(anotherToken).expect(401);
    await me(otherToken).expect(200);
    await request(app.getHttpServer())
      .get('/api/glycemias')
      .auth(oldToken, { type: 'bearer' })
      .expect(401);
    await buckets.clear();
    const fresh = await login().expect(200);
    const newToken = (fresh.body as { accessToken: string }).accessToken;
    await me(newToken).expect(200);
    const jwt = app.get(JwtService);
    expect(jwt.decode<{ ver: number }>(newToken).ver).toBe(
      jwt.decode<{ ver: number }>(oldToken).ver + 1,
    );
  });
  it('falha na transação do reset preserva senha, versão e token de recuperação', async () => {
    await forgot().expect(200);
    const token = sent.at(-1)!.token;
    const before = await users.findOneByOrFail({ email });
    const userService = app.get(UsersService);
    const original = userService.updatePasswordHash.bind(
      userService,
    ) as UsersService['updatePasswordHash'];
    const update = jest.spyOn(userService, 'updatePasswordHash');
    update.mockImplementationOnce(async (id, hash, manager) => {
      await original(id, hash, manager);
      throw new Error('synthetic rollback');
    });
    await reset(token, 'rollback-new-password-123').expect(500);
    expect((await users.findOneByOrFail({ email })).tokenVersion).toBe(
      before.tokenVersion,
    );
    const rows = app.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
    expect(
      (await rows.findOneByOrFail({ usuarioId: before.id })).usedAt,
    ).toBeNull();
    await login().expect(200);
    update.mockRestore();
    await reset(token).expect(200);
  });
  it('código inválido não incrementa versão nem invalida uma sessão válida', async () => {
    const response = await login().expect(200);
    const token = (response.body as { accessToken: string }).accessToken;
    await reset('invalid-code').expect(400);
    await me(token).expect(200);
  });
  it('rejeita JWT legado sem versão e versões malformadas mesmo com assinatura válida', async () => {
    const user = await users.findOneByOrFail({ email });
    const jwt = app.get(JwtService);
    for (const ver of [undefined, -1, '0', 0.5, user.tokenVersion + 1]) {
      await me(
        jwt.sign({ sub: user.id, ...(ver === undefined ? {} : { ver }) }),
      ).expect(401);
    }
  });
});
