import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

process.env.JWT_SECRET ??= 'segredo-somente-para-teste';
process.env.JWT_EXPIRATION ??= '15m';

interface MeBody {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
  perfil?: {
    dataNascimento: string;
    tipoDiabetes: string;
    alturaCm: number;
    pesoKg: number;
    contatoEmergencia: { nome: string; relacao: string; telefone: string };
  };
}

describe('GET /users/me (e2e)', () => {
  let app: INestApplication<App>;
  const senha = 'senha-forte-123';
  const a = { email: 'a@example.com', nome: 'Usuária A', pesoKg: 60.5 };
  const b = { email: 'b@example.com', nome: 'Usuário B', pesoKg: 90 };
  let tokenA: string;
  let tokenB: string;

  const register = (u: typeof a) =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegisterPayload({ ...u, senha }))
      .expect(201);
  const login = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, senha })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };
  const me = (token?: string) => {
    const req = request(app.getHttpServer()).get('/api/users/me');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    app = await createTestApp();
    await register(a);
    await register(b);
    tokenA = await login(a.email);
    tokenB = await login(b.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('token válido: 200 com usuário e perfil', async () => {
    const res = await me(tokenA).expect(200);
    const body = res.body as MeBody;
    expect(body).toMatchObject({ email: a.email, nome: a.nome });
    expect(body.id).toEqual(expect.any(String));
    expect(body.createdAt).toEqual(expect.any(String));
    expect(body.perfil).toEqual({
      dataNascimento: '1995-04-12',
      tipoDiabetes: 'TIPO_1',
      alturaCm: 170.5,
      pesoKg: 60.5,
      contatoEmergencia: {
        nome: 'João Silva',
        relacao: 'Pai',
        telefone: '(41) 99999-9999',
      },
    });
  });

  it('sem token: 401', async () => {
    await me().expect(401);
  });

  it('usuário A nunca recebe dados de B (e vice-versa)', async () => {
    const resA = (await me(tokenA).expect(200)).body as MeBody;
    const resB = (await me(tokenB).expect(200)).body as MeBody;
    expect(resA.email).toBe(a.email);
    expect(resB.email).toBe(b.email);
    expect(resA.id).not.toBe(resB.id);
    expect(resA.perfil?.pesoKg).toBe(60.5);
    expect(resB.perfil?.pesoKg).toBe(90);
    expect(JSON.stringify(resA)).not.toContain(b.email);
  });

  it('ignora tentativa de escolher outro usuário por query', async () => {
    const idB = ((await me(tokenB).expect(200)).body as MeBody).id;
    const res = await request(app.getHttpServer())
      .get(`/api/users/me?id=${idB}&userId=${idB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect((res.body as MeBody).email).toBe(a.email);
  });

  it('não expõe senha nem hash', async () => {
    const res = await me(tokenA).expect(200);
    const json = JSON.stringify(res.body);
    expect(res.body).not.toHaveProperty('senhaHash');
    expect(res.body).not.toHaveProperty('senha');
    expect(json).not.toContain('$2b$');
    expect(json.toLowerCase()).not.toContain('hash');
  });

  it('token válido de usuário removido: 401', async () => {
    await register({ email: 'c@example.com', nome: 'C', pesoKg: 70 });
    const token = await login('c@example.com');
    await app
      .get<Repository<User>>(getRepositoryToken(User))
      .delete({ email: 'c@example.com' });
    await me(token).expect(401);
  });
});