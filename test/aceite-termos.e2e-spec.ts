import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { VERSAO_ATUAL_TERMOS } from '../src/modules/auth/terms-policy';
import { User } from '../src/modules/users/entities/user.entity';
import { createTestApp } from './utils/create-test-app';

describe('Aceite de termos (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const senha = 'senha-forte-123';
  const email = 'aceite@example.com';
  let token: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DataSource);
    const cadastro = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ nome: 'Pessoa', email, senha })
      .expect(201);
    userId = (cadastro.body as { id: string }).id;
    expect(
      (cadastro.body as { termosVersaoAceita: string | null })
        .termosVersaoAceita,
    ).toBeNull();
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, senha })
      .expect(200);
    const body = login.body as {
      accessToken: string;
      user: { termosVersaoAceita: string | null; perfilCompleto: boolean };
    };
    token = body.accessToken;
    expect(body.user.termosVersaoAceita).toBeNull();
    expect(body.user.perfilCompleto).toBe(false);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token responde 401', async () => {
    await request(app.getHttpServer())
      .post('/api/users/me/termos')
      .send({ versaoTermos: VERSAO_ATUAL_TERMOS })
      .expect(401);
  });

  it.each([undefined, {}, { versaoTermos: 'antiga' }])(
    'valida a versão obrigatória: %p',
    async (body) => {
      const req = request(app.getHttpServer())
        .post('/api/users/me/termos')
        .set('Authorization', `Bearer ${token}`);
      const res = await (body === undefined ? req : req.send(body)).expect(400);
      const details = (res.body as ErrorResponseDto).details;
      expect(
        details?.find((d) => d.field === 'versaoTermos')?.messages,
      ).toContain(`versaoTermos deve ser igual a ${VERSAO_ATUAL_TERMOS}`);
    },
  );

  it('aceita com perfil incompleto e preserva a data no segundo aceite', async () => {
    const antes = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      (antes.body as { termosVersaoAceita: string | null }).termosVersaoAceita,
    ).toBeNull();
    const post = () =>
      request(app.getHttpServer())
        .post('/api/users/me/termos')
        .set('Authorization', `Bearer ${token}`)
        .send({ versaoTermos: VERSAO_ATUAL_TERMOS });
    const aceito = await post().expect(200);
    expect(aceito.body).toMatchObject({
      termosVersaoAceita: VERSAO_ATUAL_TERMOS,
      perfilCompleto: false,
    });
    const user = await db.getRepository(User).findOneByOrFail({ id: userId });
    expect(user.termosVersao).toBe(VERSAO_ATUAL_TERMOS);
    expect(user.termosAceitosEm).toBeInstanceOf(Date);
    const data = new Date('2020-01-01T12:00:00.000Z');
    await db
      .getRepository(User)
      .update({ id: userId }, { termosAceitosEm: data });
    await post().expect(200);
    const depois = await db.getRepository(User).findOneByOrFail({ id: userId });
    expect(depois.termosAceitosEm?.getTime()).toBe(data.getTime());
    const me = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body).toEqual(aceito.body);
  });

  it('cadastro com aceite devolve a versão também no login', async () => {
    const emailAceito = 'com-aceite@example.com';
    const cadastro = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nome: 'Pessoa',
        email: emailAceito,
        senha,
        versaoTermos: VERSAO_ATUAL_TERMOS,
      })
      .expect(201);
    expect(cadastro.body).toMatchObject({
      termosVersaoAceita: VERSAO_ATUAL_TERMOS,
    });
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: emailAceito, senha })
      .expect(200);
    expect(login.body).toMatchObject({
      user: { termosVersaoAceita: VERSAO_ATUAL_TERMOS },
    });
  });

  it('recusa token de conta excluída', async () => {
    await request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/users/me/termos')
      .set('Authorization', `Bearer ${token}`)
      .send({ versaoTermos: VERSAO_ATUAL_TERMOS })
      .expect(401);
  });
});
