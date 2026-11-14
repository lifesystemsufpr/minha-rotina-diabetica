import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { LoginResponseDto } from '../src/modules/auth/dto/login-response.dto';
import { ProfileResponseDto } from '../src/modules/profile/dto/profile-response.dto';
import { UserResponseDto } from '../src/modules/users/dto/user-response.dto';
import { SENHA_TESTE } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

// Fluxo do cadastro em duas etapas (nov/2026):
// 1. POST /auth/register com nome, e-mail e senha;
// 2. PATCH /profile com os dados de saúde.
// Entre as duas, só Home, perfil e conta ficam liberados.
describe('Cadastro em duas etapas (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  const http = () => request(app.getHttpServer());
  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

  // Rotas das funcionalidades que exigem perfil completo.
  // Sempre 3 itens por linha: com 2, o Jest passaria o callback `done` como
  // 3º argumento e o teste ficaria esperando para sempre.
  const bloqueadas: [string, string, object | null][] = [
    ['get', '/api/glycemias', null],
    [
      'post',
      '/api/glycemias',
      { valor: 110, momento: 'JEJUM', dataHora: '2026-10-12T08:30:00-03:00' },
    ],
    ['get', '/api/insulin-applications', null],
    ['get', '/api/reminders', null],
    ['get', '/api/reports/records', null],
    ['get', '/api/reports/pdf', null],
    ['get', '/api/dashboard', null],
  ];
  const chamar = (metodo: string, url: string, body: object | null) => {
    const req = auth(http()[metodo as 'get'](url));
    return body ? req.send(body) : req;
  };

  beforeAll(async () => {
    app = await createTestApp();

    const cadastro = await http()
      .post('/api/auth/register')
      .send({
        nome: 'Ana Etapas',
        email: 'etapas@teste.local',
        senha: SENHA_TESTE,
      })
      .expect(201);
    expect((cadastro.body as UserResponseDto).perfilCompleto).toBe(false);

    const login = await http()
      .post('/api/auth/login')
      .send({ email: 'etapas@teste.local', senha: SENHA_TESTE })
      .expect(200);
    const body = login.body as LoginResponseDto;
    expect(body.user.perfilCompleto).toBe(false);
    token = body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('antes de completar o perfil', () => {
    it.each(bloqueadas)(
      '%s %s responde 403 PERFIL_INCOMPLETO',
      async (metodo, url, body) => {
        const res = await chamar(metodo, url, body).expect(403);
        const erro = res.body as ErrorResponseDto;
        expect(erro.code).toBe('PERFIL_INCOMPLETO');
        expect(erro.statusCode).toBe(403);
      },
    );

    it('sem token continua 401 (não 403)', () =>
      http().get('/api/glycemias').expect(401));

    it('Home fica liberada (vazia)', async () => {
      const res = await auth(http().get('/api/home/summary')).expect(200);
      expect((res.body as { nome: string }).nome).toBe('Ana Etapas');
    });

    it('/users/me e /profile ficam liberados e mostram perfil incompleto', async () => {
      const me = (await auth(http().get('/api/users/me')).expect(200))
        .body as UserResponseDto;
      expect(me.perfilCompleto).toBe(false);

      const perfil = (await auth(http().get('/api/profile')).expect(200))
        .body as ProfileResponseDto;
      expect(perfil).toMatchObject({
        dataNascimento: null,
        tipoDiabetes: null,
        alturaCm: null,
        pesoKg: null,
        perfilCompleto: false,
      });
    });

    it('perfil parcial continua bloqueado', async () => {
      const parcial = (
        await auth(http().patch('/api/profile'))
          .send({ dataNascimento: '1990-05-20', tipoDiabetes: 'TIPO_2' })
          .expect(200)
      ).body as ProfileResponseDto;
      expect(parcial.perfilCompleto).toBe(false);
      await auth(http().get('/api/glycemias')).expect(403);
    });
  });

  describe('depois de completar o perfil', () => {
    beforeAll(async () => {
      const res = await auth(http().patch('/api/profile'))
        .send({ alturaCm: 165, pesoKg: 62.5 })
        .expect(200);
      expect((res.body as ProfileResponseDto).perfilCompleto).toBe(true);
    });

    it.each(bloqueadas)('%s %s fica liberada', async (metodo, url, body) => {
      const res = await chamar(metodo, url, body);
      expect([200, 201]).toContain(res.status);
    });

    it('o login passa a informar perfilCompleto: true', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: 'etapas@teste.local', senha: SENHA_TESTE })
        .expect(200);
      expect((res.body as LoginResponseDto).user.perfilCompleto).toBe(true);
    });
  });
});
