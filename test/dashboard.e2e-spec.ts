import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { DashboardResponseDto } from '../src/modules/dashboard/dto/dashboard-response.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

// Horários ao meio-dia (UTC) para o dia não mudar com o fuso da máquina.
describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenVazio: string;

  const http = () => request(app.getHttpServer());
  const dashboard = (token: string | undefined, query = '') => {
    const req = http().get(`/api/dashboard${query}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@dashboard.local')).token;
    tokenB = (await registerAndLogin(app, 'b@dashboard.local')).token;
    tokenVazio = (await registerAndLogin(app, 'c@dashboard.local')).token;

    const post = (token: string, rota: string, body: object) =>
      http()
        .post(`/api/${rota}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201);

    for (const [valor, momento, dataHora] of [
      [100, 'JEJUM', '2026-10-05T12:00:00Z'],
      [200, 'APOS_ALMOCO', '2026-10-06T12:00:00Z'],
      [60, 'ANTES_JANTAR', '2026-10-07T12:00:00Z'],
    ] as const) {
      await post(tokenA, 'glycemias', { valor, momento, dataHora });
    }
    for (const [doseUi, dataHora] of [
      [10, '2026-10-05T12:00:00Z'],
      [4.5, '2026-10-05T13:00:00Z'],
      [8, '2026-10-07T12:00:00Z'],
    ] as const) {
      await post(tokenA, 'insulin-applications', {
        tipo: 'Rápida',
        doseUi,
        localAplicacao: 'ABDOMEN',
        dataHora,
      });
    }
    // Outra usuária: não pode entrar nos cálculos da A.
    await post(tokenB, 'glycemias', {
      valor: 400,
      momento: 'JEJUM',
      dataHora: '2026-10-06T12:00:00Z',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token responde 401', () => dashboard(undefined).expect(401));

  it('calcula média, maior, menor e as séries só com os dados da usuária', async () => {
    const body = (await dashboard(tokenA).expect(200))
      .body as DashboardResponseDto;

    expect(body.mediaGlicemia).toBe(120);
    expect(body.maiorValor).toMatchObject({
      valor: 200,
      momento: 'APOS_ALMOCO',
    });
    expect(body.menorValor).toMatchObject({
      valor: 60,
      momento: 'ANTES_JANTAR',
    });
    expect(body.glicemiaAoLongoDoDia.map((p) => p.valor)).toEqual([
      100, 200, 60,
    ]);
    expect(body.insulinaTotalDiaria).toEqual([
      { data: '2026-10-05', totalUi: 14.5 },
      { data: '2026-10-07', totalUi: 8 },
    ]);
    expect(body.distribuicaoLeituras).toEqual({
      total: 3,
      muitoBaixa: { quantidade: 0, percentual: 0 },
      baixa: { quantidade: 1, percentual: 33.3 },
      noAlvo: { quantidade: 1, percentual: 33.3 },
      alta: { quantidade: 1, percentual: 33.3 },
      muitoAlta: { quantidade: 0, percentual: 0 },
    });
    expect(body.mediaPorMomento).toEqual([
      { momento: 'JEJUM', media: 100, quantidade: 1 },
      { momento: 'APOS_ALMOCO', media: 200, quantidade: 1 },
      { momento: 'ANTES_JANTAR', media: 60, quantidade: 1 },
    ]);
  });

  it('respeita o período', async () => {
    const body = (
      await dashboard(
        tokenA,
        '?startDate=2026-10-06&endDate=2026-10-07',
      ).expect(200)
    ).body as DashboardResponseDto;

    expect(body.mediaGlicemia).toBe(130);
    expect(body.maiorValor?.valor).toBe(200);
    expect(body.insulinaTotalDiaria).toEqual([
      { data: '2026-10-07', totalUi: 8 },
    ]);
  });

  it('sem dados responde 200 com null e listas vazias (sem divisão por zero)', async () => {
    const body = (await dashboard(tokenVazio).expect(200))
      .body as DashboardResponseDto;

    expect(body).toEqual({
      mediaGlicemia: null,
      maiorValor: null,
      menorValor: null,
      glicemiaAoLongoDoDia: [],
      insulinaTotalDiaria: [],
      distribuicaoLeituras: {
        total: 0,
        muitoBaixa: { quantidade: 0, percentual: null },
        baixa: { quantidade: 0, percentual: null },
        noAlvo: { quantidade: 0, percentual: null },
        alta: { quantidade: 0, percentual: null },
        muitoAlta: { quantidade: 0, percentual: null },
      },
      mediaPorMomento: [],
    });
  });

  it('cada usuária vê só os próprios indicadores', async () => {
    const body = (await dashboard(tokenB).expect(200))
      .body as DashboardResponseDto;
    expect(body.mediaGlicemia).toBe(400);
    expect(body.insulinaTotalDiaria).toEqual([]);
  });

  it('período inválido responde 400 no formato padrão', async () => {
    const res = await dashboard(
      tokenA,
      '?startDate=2026-10-13&endDate=2026-10-01',
    ).expect(400);
    const fields = (res.body as ErrorResponseDto).details?.map((d) => d.field);
    expect(fields).toEqual(['endDate']);
  });
});
