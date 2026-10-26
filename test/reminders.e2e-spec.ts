import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { ReminderResponseDto } from '../src/modules/reminders/dto/reminder-response.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

const lembrete = {
  titulo: 'Tomar insulina',
  dataHora: '2026-10-25T08:00:00-03:00',
};

describe('Lembretes (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenVazio: string;

  const api = (token?: string) => {
    const auth = (r: request.Test) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    const http = request(app.getHttpServer());
    return {
      post: (body: object) => auth(http.post('/api/reminders')).send(body),
      list: () => auth(http.get('/api/reminders')),
      get: (id: string) => auth(http.get(`/api/reminders/${id}`)),
      patch: (id: string, body: object) =>
        auth(http.patch(`/api/reminders/${id}`)).send(body),
      status: (id: string, body: object) =>
        auth(http.patch(`/api/reminders/${id}/status`)).send(body),
      del: (id: string) => auth(http.delete(`/api/reminders/${id}`)),
    };
  };

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@lembrete.local')).token;
    tokenB = (await registerAndLogin(app, 'b@lembrete.local')).token;
    tokenVazio = (await registerAndLogin(app, 'c@lembrete.local')).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /reminders', () => {
    it('lembrete novo nasce ATIVO (201)', async () => {
      const res = await api(tokenA).post(lembrete).expect(201);
      const body = res.body as ReminderResponseDto;
      expect(body.id).toEqual(expect.any(String));
      expect(body.titulo).toBe('Tomar insulina');
      expect(body.status).toBe('ATIVO');
    });

    it('sem token retorna 401', () => api().post(lembrete).expect(401));

    it.each([
      ['título vazio', { titulo: '   ' }, 'titulo'],
      ['título longo demais', { titulo: 'a'.repeat(151) }, 'titulo'],
      ['data inválida', { dataHora: '25-10-2026 08:00' }, 'dataHora'],
      ['status enviado pelo mobile', { status: 'INATIVO' }, 'status'],
      ['dono enviado pelo mobile', { usuarioId: 'outro' }, 'usuarioId'],
    ])('%s retorna 400', async (_nome, extra, campo) => {
      const res = await api(tokenA)
        .post({ ...lembrete, ...extra })
        .expect(400);
      const campos = (res.body as ErrorResponseDto).details?.map(
        (d) => d.field,
      );
      expect(campos).toContain(campo);
    });
  });

  describe('GET /reminders', () => {
    it('lista vazia retorna 200', async () => {
      const res = await api(tokenVazio).list().expect(200);
      expect(res.body).toEqual([]);
    });

    it('lista só os lembretes do dono, ordenados por horário', async () => {
      await api(tokenB)
        .post({ titulo: 'Jantar', dataHora: '2026-10-25T19:00:00-03:00' })
        .expect(201);
      await api(tokenB)
        .post({ titulo: 'Café', dataHora: '2026-10-25T07:00:00-03:00' })
        .expect(201);

      const lista = (await api(tokenB).list().expect(200))
        .body as ReminderResponseDto[];
      expect(lista.map((l) => l.titulo)).toEqual(['Café', 'Jantar']);
    });
  });

  describe('por ID', () => {
    let id: string;

    beforeAll(async () => {
      id = (
        (await api(tokenA).post(lembrete).expect(201))
          .body as ReminderResponseDto
      ).id;
    });

    it('GET do próprio lembrete retorna 200', async () => {
      const res = await api(tokenA).get(id).expect(200);
      expect((res.body as ReminderResponseDto).id).toBe(id);
    });

    it('lembrete de outro usuário não é exposto (404)', () =>
      api(tokenB).get(id).expect(404));

    it('id inexistente retorna 404 e id malformado retorna 400', async () => {
      await api(tokenA).get('5b6c1f7e-1d2b-4c3a-9f8e-123456789abc').expect(404);
      await api(tokenA).get('nao-e-uuid').expect(400);
    });

    it('PATCH edita título e horário', async () => {
      const res = await api(tokenA)
        .patch(id, { titulo: 'Medir glicemia' })
        .expect(200);
      const body = res.body as ReminderResponseDto;
      expect(body.titulo).toBe('Medir glicemia');
      expect(body.status).toBe('ATIVO');
    });

    it('PATCH não altera o status nem aceita corpo vazio', async () => {
      await api(tokenA).patch(id, { status: 'INATIVO' }).expect(400);
      await api(tokenA).patch(id, {}).expect(400);
    });

    it('o switch alterna ATIVO -> INATIVO -> ATIVO', async () => {
      const inativo = await api(tokenA)
        .status(id, { status: 'INATIVO' })
        .expect(200);
      expect((inativo.body as ReminderResponseDto).status).toBe('INATIVO');

      const ativo = await api(tokenA)
        .status(id, { status: 'ATIVO' })
        .expect(200);
      expect((ativo.body as ReminderResponseDto).status).toBe('ATIVO');
    });

    it('status inválido retorna 400', () =>
      api(tokenA).status(id, { status: 'PAUSADO' }).expect(400));

    it('outro usuário não altera nem exclui (404)', async () => {
      await api(tokenB).patch(id, { titulo: 'Invadido' }).expect(404);
      await api(tokenB).status(id, { status: 'INATIVO' }).expect(404);
      await api(tokenB).del(id).expect(404);
      const res = await api(tokenA).get(id).expect(200);
      expect((res.body as ReminderResponseDto).titulo).toBe('Medir glicemia');
    });

    it('DELETE retorna 204 e o lembrete sai da listagem', async () => {
      await api(tokenA).del(id).expect(204);
      await api(tokenA).get(id).expect(404);
      const lista = (await api(tokenA).list().expect(200))
        .body as ReminderResponseDto[];
      expect(lista.map((l) => l.id)).not.toContain(id);
    });
  });
});
