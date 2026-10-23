import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { InsulinResponseDto } from '../src/modules/insulin/dto/insulin-response.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

const aplicacao = {
  tipo: 'Rápida',
  doseUi: 10,
  localAplicacao: 'ABDOMEN',
  dataHora: '2026-10-12T08:30:00-03:00',
  observacao: 'Antes do almoço',
};

describe('Aplicações de insulina (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenVazio: string;

  const api = (token?: string) => {
    const auth = (r: request.Test) =>
      token ? r.set('Authorization', `Bearer ${token}`) : r;
    const http = request(app.getHttpServer());
    return {
      post: (body: object) =>
        auth(http.post('/api/insulin-applications')).send(body),
      list: (query = '') => auth(http.get(`/api/insulin-applications${query}`)),
      get: (id: string) => auth(http.get(`/api/insulin-applications/${id}`)),
      patch: (id: string, body: object) =>
        auth(http.patch(`/api/insulin-applications/${id}`)).send(body),
      del: (id: string) => auth(http.delete(`/api/insulin-applications/${id}`)),
    };
  };

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@insulina.local')).token;
    tokenB = (await registerAndLogin(app, 'b@insulina.local')).token;
    tokenVazio = (await registerAndLogin(app, 'c@insulina.local')).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /insulin-applications', () => {
    it('registro válido retorna 201', async () => {
      const res = await api(tokenA).post(aplicacao).expect(201);
      const body = res.body as InsulinResponseDto;
      expect(body.id).toEqual(expect.any(String));
      expect(body.doseUi).toBe(10);
      expect(body.localAplicacao).toBe('ABDOMEN');
    });

    it('aceita todos os locais do protótipo', async () => {
      for (const localAplicacao of ['ABDOMEN', 'BRACO', 'COXA', 'GLUTEO']) {
        await api(tokenA)
          .post({ ...aplicacao, localAplicacao })
          .expect(201);
      }
    });

    it('sem token retorna 401', () => api().post(aplicacao).expect(401));

    it.each([
      ['dose zero', { doseUi: 0 }, 'doseUi'],
      ['dose negativa', { doseUi: -2 }, 'doseUi'],
      ['dose como texto', { doseUi: 'dez' }, 'doseUi'],
      ['local fora da lista', { localAplicacao: 'outro' }, 'localAplicacao'],
      ['tipo vazio', { tipo: '' }, 'tipo'],
      ['data inválida', { dataHora: '12-10-2026T08:30:00.000Z' }, 'dataHora'],
      ['dono enviado pelo mobile', { usuarioId: 'outro' }, 'usuarioId'],
    ])('%s retorna 400', async (_nome, extra, campo) => {
      const res = await api(tokenA)
        .post({ ...aplicacao, ...extra })
        .expect(400);
      expect(
        (res.body as ErrorResponseDto).details?.map((d) => d.field),
      ).toContain(campo);
    });
  });

  describe('GET /insulin-applications', () => {
    it('lista vazia retorna 200', async () => {
      const res = await api(tokenVazio).list().expect(200);
      expect(res.body).toEqual([]);
    });

    it('lista só os registros do dono, do mais recente para o mais antigo', async () => {
      await api(tokenB)
        .post({ ...aplicacao, tipo: 'Basal', dataHora: '2026-10-01T22:00:00Z' })
        .expect(201);
      await api(tokenB)
        .post({ ...aplicacao, dataHora: '2026-10-05T12:00:00Z' })
        .expect(201);

      const lista = (await api(tokenB).list().expect(200))
        .body as InsulinResponseDto[];
      expect(lista).toHaveLength(2);
      expect(new Date(lista[0].dataHora) > new Date(lista[1].dataHora)).toBe(
        true,
      );
    });

    it('filtra por período (dias inteiros) e tipo', async () => {
      const periodo = (
        await api(tokenB)
          .list('?startDate=2026-10-05&endDate=2026-10-05')
          .expect(200)
      ).body as InsulinResponseDto[];
      expect(periodo).toHaveLength(1);

      const basal = (await api(tokenB).list('?tipo=Basal').expect(200))
        .body as InsulinResponseDto[];
      expect(basal.map((i) => i.tipo)).toEqual(['Basal']);
    });

    it('filtro de data inválido retorna 400', () =>
      api(tokenB).list('?endDate=13-10-2026').expect(400));
  });

  describe('por ID', () => {
    let idA: string;

    beforeAll(async () => {
      idA = (
        (await api(tokenA).post(aplicacao).expect(201))
          .body as InsulinResponseDto
      ).id;
    });

    it('GET do próprio registro retorna 200', async () => {
      const res = await api(tokenA).get(idA).expect(200);
      expect((res.body as InsulinResponseDto).id).toBe(idA);
    });

    it('registro de outro usuário não é exposto (404)', () =>
      api(tokenB).get(idA).expect(404));

    it('id inexistente retorna 404 e id malformado retorna 400', async () => {
      await api(tokenA).get('5b6c1f7e-1d2b-4c3a-9f8e-123456789abc').expect(404);
      await api(tokenA).get('insulina-teste-1').expect(400);
    });

    it('PATCH altera só os campos enviados', async () => {
      const res = await api(tokenA).patch(idA, { doseUi: 12.5 }).expect(200);
      const body = res.body as InsulinResponseDto;
      expect(body.doseUi).toBe(12.5);
      expect(body.tipo).toBe('Rápida');
    });

    it('PATCH inválido retorna 400', async () => {
      await api(tokenA).patch(idA, { doseUi: 0 }).expect(400);
      await api(tokenA).patch(idA, {}).expect(400);
    });

    it('PATCH e DELETE de outro usuário não alteram nada (404)', async () => {
      await api(tokenB).patch(idA, { doseUi: 1 }).expect(404);
      await api(tokenB).del(idA).expect(404);
      const res = await api(tokenA).get(idA).expect(200);
      expect((res.body as InsulinResponseDto).doseUi).toBe(12.5);
    });

    it('DELETE do próprio registro retorna 204 e ele some', async () => {
      await api(tokenA).del(idA).expect(204);
      await api(tokenA).get(idA).expect(404);
    });
  });
});
