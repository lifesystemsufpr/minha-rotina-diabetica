import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { GlycemiaResponseDto } from '../src/modules/glycemia/dto/glycemia-response.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

const medicao = {
  valor: 110,
  momento: 'JEJUM',
  dataHora: '2026-10-12T08:30:00-03:00',
  observacao: 'Antes do café',
};

describe('Glicemias (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenVazio: string;

  const api = (token?: string) => {
    const auth = (r: request.Test) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    const http = request(app.getHttpServer());
    return {
      post: (body: object) => auth(http.post('/api/glycemias')).send(body),
      list: (query = '') => auth(http.get(`/api/glycemias${query}`)),
      get: (id: string) => auth(http.get(`/api/glycemias/${id}`)),
      patch: (id: string, body: object) =>
        auth(http.patch(`/api/glycemias/${id}`)).send(body),
      del: (id: string) => auth(http.delete(`/api/glycemias/${id}`)),
    };
  };

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@glicemia.local')).token;
    tokenB = (await registerAndLogin(app, 'b@glicemia.local')).token;
    tokenVazio = (await registerAndLogin(app, 'c@glicemia.local')).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /glycemias', () => {
    it('registro válido retorna 201 com o status calculado', async () => {
      const res = await api(tokenA).post(medicao).expect(201);
      const body = res.body as GlycemiaResponseDto;
      expect(body.id).toEqual(expect.any(String));
      expect(body.valor).toBe(110);
      expect(body.status).toBe('NORMAL');
      expect(new Date(body.dataHora).toISOString()).toBe(
        '2026-10-12T11:30:00.000Z',
      );
    });

    it.each([
      [69, 'BAIXA'],
      [181, 'ALTA'],
    ])('valor %s mg/dL fica com status %s', async (valor, status) => {
      const res = await api(tokenA)
        .post({ ...medicao, valor })
        .expect(201);
      expect((res.body as GlycemiaResponseDto).status).toBe(status);
    });

    it('sem token retorna 401', () => api().post(medicao).expect(401));

    it.each([
      ['valor negativo', { valor: -1 }, 'valor'],
      ['valor acima do limite', { valor: 1000 }, 'valor'],
      ['momento fora da lista', { momento: 'ao_dormir' }, 'momento'],
      ['data em outro formato', { dataHora: '14-04-2026' }, 'dataHora'],
      ['data inexistente', { dataHora: '2026-02-30T08:00:00Z' }, 'dataHora'],
      ['status enviado pelo mobile', { status: 'NORMAL' }, 'status'],
      ['dono enviado pelo mobile', { usuarioId: 'outro' }, 'usuarioId'],
    ])('%s retorna 400', async (_nome, extra, campo) => {
      const res = await api(tokenA)
        .post({ ...medicao, ...extra })
        .expect(400);
      expect(
        (res.body as ErrorResponseDto).details?.map((d) => d.field),
      ).toContain(campo);
    });
  });

  describe('GET /glycemias', () => {
    it('lista vazia retorna 200', async () => {
      const res = await api(tokenVazio).list().expect(200);
      expect(res.body).toEqual([]);
    });

    it('lista só os registros do dono, do mais recente para o mais antigo', async () => {
      await api(tokenB)
        .post({ ...medicao, dataHora: '2026-10-01T08:00:00Z' })
        .expect(201);
      await api(tokenB)
        .post({ ...medicao, dataHora: '2026-10-05T08:00:00Z' })
        .expect(201);

      const lista = (await api(tokenB).list().expect(200))
        .body as GlycemiaResponseDto[];
      expect(lista).toHaveLength(2);
      expect(new Date(lista[0].dataHora) > new Date(lista[1].dataHora)).toBe(
        true,
      );
    });

    it('filtra por período (dias inteiros) e momento', async () => {
      const periodo = (
        await api(tokenB)
          .list('?startDate=2026-10-05&endDate=2026-10-05')
          .expect(200)
      ).body as GlycemiaResponseDto[];
      expect(periodo).toHaveLength(1);

      const porMomento = (
        await api(tokenB).list('?momento=APOS_JANTAR').expect(200)
      ).body as GlycemiaResponseDto[];
      expect(porMomento).toEqual([]);
    });

    it('filtro inválido retorna 400', async () => {
      await api(tokenB).list('?startDate=10-10-2026').expect(400);
      await api(tokenB).list('?momento=qualquer').expect(400);
    });
  });

  describe('por ID', () => {
    let idA: string;

    beforeAll(async () => {
      idA = (
        (await api(tokenA).post(medicao).expect(201))
          .body as GlycemiaResponseDto
      ).id;
    });

    it('GET do próprio registro retorna 200', async () => {
      const res = await api(tokenA).get(idA).expect(200);
      expect((res.body as GlycemiaResponseDto).id).toBe(idA);
    });

    it('registro de outro usuário não é exposto (404)', () =>
      api(tokenB).get(idA).expect(404));

    it('id inexistente retorna 404 e id malformado retorna 400', async () => {
      await api(tokenA).get('5b6c1f7e-1d2b-4c3a-9f8e-123456789abc').expect(404);
      await api(tokenA).get('nao-e-uuid').expect(400);
    });

    it('PATCH recalcula o status e mantém os outros campos', async () => {
      const res = await api(tokenA).patch(idA, { valor: 250 }).expect(200);
      const body = res.body as GlycemiaResponseDto;
      expect(body.status).toBe('ALTA');
      expect(body.momento).toBe('JEJUM');
    });

    it('PATCH inválido retorna 400', async () => {
      await api(tokenA).patch(idA, { valor: 0 }).expect(400);
      await api(tokenA).patch(idA, {}).expect(400);
    });

    it('PATCH de outro usuário não altera nada (404)', async () => {
      await api(tokenB).patch(idA, { valor: 50 }).expect(404);
      const res = await api(tokenA).get(idA).expect(200);
      expect((res.body as GlycemiaResponseDto).valor).toBe(250);
    });

    it('DELETE de outro usuário retorna 404 e não apaga', async () => {
      await api(tokenB).del(idA).expect(404);
      await api(tokenA).get(idA).expect(200);
    });

    it('DELETE do próprio registro retorna 204 e ele some', async () => {
      await api(tokenA).del(idA).expect(204);
      await api(tokenA).get(idA).expect(404);
      const lista = (await api(tokenA).list().expect(200))
        .body as GlycemiaResponseDto[];
      expect(lista.map((g) => g.id)).not.toContain(idA);
    });
  });
});
