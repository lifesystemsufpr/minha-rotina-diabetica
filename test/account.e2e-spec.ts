import { afterAll, beforeAll, describe, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { registerAndLogin, SENHA_TESTE } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

describe('Exclusão de conta (e2e)', () => {
  let app: INestApplication<App>;
  const email = 'excluir@conta.local';
  let token: string;
  let tokenOutro: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = (await registerAndLogin(app, email)).token;
    tokenOutro = (await registerAndLogin(app, 'fica@conta.local')).token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE sem token retorna 401', () =>
    request(app.getHttpServer()).delete('/api/users/me').expect(401));

  it('DELETE com token exclui a conta (204)', () =>
    request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(204));

  it('o token emitido antes da exclusão deixa de ser aceito', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401));

  it('a conta excluída não consegue fazer login', () =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, senha: SENHA_TESTE })
      .expect(401));

  it('a exclusão não afeta outros usuários', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenOutro}`)
      .expect(200));
});
