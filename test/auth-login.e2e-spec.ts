import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

interface LoginBody {
  accessToken: string;
  user: { id: string; nome: string; email: string };
}

describe('POST /auth/login (e2e)', () => {
  let app: INestApplication<App>;
  const email = 'login@example.com';
  const senha = 'senha-forte-123';
  const login = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send(body as object);

  beforeAll(async () => {
    app = await createTestApp();
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegisterPayload({ email, senha }))
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('credenciais válidas retornam 200, token e dados mínimos', async () => {
    const res = await login({ email, senha }).expect(200);
    const body = res.body as LoginBody;

    expect(body.accessToken).toEqual(expect.any(String));
    expect(Object.keys(body).sort()).toEqual(['accessToken', 'user']);
    expect(Object.keys(body.user).sort()).toEqual(['email', 'id', 'nome']);
    expect(JSON.stringify(body)).not.toContain('$2b$');
    expect(JSON.stringify(body)).not.toContain('senha');
  });

  it('aceita e-mail com maiúsculas/espaços (normalizado)', async () => {
    await login({ email: '  LOGIN@Example.com ', senha }).expect(200);
  });

  it('o token retornado funciona em rota protegida e identifica o dono', async () => {
    const res = await login({ email, senha }).expect(200);
    const me = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${(res.body as LoginBody).accessToken}`)
      .expect(200);
    expect((me.body as { email: string }).email).toBe(email);
  });

  it('senha inválida e usuário inexistente: 401 com a MESMA resposta genérica', async () => {
    const wrongPassword = await login({ email, senha: 'errada-12345' }).expect(
      401,
    );
    const unknownUser = await login({
      email: 'ninguem@example.com',
      senha,
    }).expect(401);

    const a = wrongPassword.body as ErrorResponseDto;
    const b = unknownUser.body as ErrorResponseDto;
    expect(a.message).toBe('E-mail ou senha inválidos');
    expect(b.message).toBe(a.message);
    expect(b.statusCode).toBe(a.statusCode);
    expect(b.error).toBe(a.error);
    expect(a).not.toHaveProperty('details');
  });

  describe('DTO inválido retorna 400', () => {
    it.each([
      ['e-mail inválido', { email: 'nao-e-email', senha }],
      ['e-mail ausente', { senha }],
      ['senha ausente', { email }],
      ['senha vazia', { email, senha: '' }],
      ['senha como número', { email, senha: { $ne: '' } }],
      ['corpo vazio', {}],
      ['propriedade extra', { email, senha, admin: true }],
    ])('%s', async (_name, body) => {
      await login(body).expect(400);
    });
  });
});
