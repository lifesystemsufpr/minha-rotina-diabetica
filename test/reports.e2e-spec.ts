import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { ReportRecordDto } from '../src/modules/reports/dto/report-record.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

// Horários ao meio-dia (UTC) para o dia não mudar com o fuso da máquina.
describe('Relatórios: histórico consolidado (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenVazio: string;

  const http = () => request(app.getHttpServer());
  const records = (token: string | undefined, query = '') => {
    const req = http().get(`/api/reports/records${query}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@reports.local')).token;
    tokenB = (await registerAndLogin(app, 'b@reports.local')).token;
    tokenVazio = (await registerAndLogin(app, 'c@reports.local')).token;

    const post = (token: string, rota: string, body: object) =>
      http()
        .post(`/api/${rota}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201);

    await post(tokenA, 'glycemias', {
      valor: 65,
      momento: 'JEJUM',
      dataHora: '2026-10-05T12:00:00Z',
    });
    await post(tokenA, 'insulin-applications', {
      tipo: 'Basal',
      doseUi: 12,
      localAplicacao: 'COXA',
      dataHora: '2026-10-05T12:30:00Z',
    });
    await post(tokenA, 'glycemias', {
      valor: 190,
      momento: 'APOS_ALMOCO',
      dataHora: '2026-10-07T12:00:00Z',
      observacao: 'Depois do almoço de domingo',
    });
    // Registro de outra usuária, no mesmo período.
    await post(tokenB, 'glycemias', {
      valor: 300,
      momento: 'JEJUM',
      dataHora: '2026-10-05T12:00:00Z',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token responde 401', () => records(undefined).expect(401));

  it('junta glicemias e insulina, do mais recente para o mais antigo', async () => {
    const body = (await records(tokenA).expect(200)).body as ReportRecordDto[];

    expect(body.map((r) => r.type)).toEqual([
      'GLYCEMIA',
      'INSULIN',
      'GLYCEMIA',
    ]);
    expect(body[0]).toMatchObject({
      glycemia: {
        valor: 190,
        momento: 'APOS_ALMOCO',
        status: 'ALTA',
        observacao: 'Depois do almoço de domingo',
      },
      insulin: null,
    });
    expect(body[1]).toMatchObject({
      glycemia: null,
      insulin: {
        tipo: 'Basal',
        doseUi: 12,
        localAplicacao: 'COXA',
        observacao: null,
      },
    });
    expect(body[2].glycemia?.status).toBe('BAIXA');
    expect(new Date(body[0].dateTime).toISOString()).toBe(
      '2026-10-07T12:00:00.000Z',
    );
  });

  it('traz somente os registros do dono do token', async () => {
    const deB = (await records(tokenB).expect(200)).body as ReportRecordDto[];
    expect(deB).toHaveLength(1);
    expect(deB[0].glycemia?.valor).toBe(300);
  });

  it('respeita o período (dias inteiros, inclusivos)', async () => {
    const body = (
      await records(tokenA, '?startDate=2026-10-05&endDate=2026-10-05').expect(
        200,
      )
    ).body as ReportRecordDto[];
    expect(body.map((r) => r.type)).toEqual(['INSULIN', 'GLYCEMIA']);
  });

  it('usuária sem registros recebe lista vazia', async () => {
    const res = await records(tokenVazio).expect(200);
    expect(res.body).toEqual([]);
  });

  it('período inválido responde 400 no formato padrão', async () => {
    const res = await records(
      tokenA,
      '?startDate=2026-10-13&endDate=2026-10-01',
    ).expect(400);
    const fields = (res.body as ErrorResponseDto).details?.map((d) => d.field);
    expect(fields).toEqual(['endDate']);
  });

  it('não aceita escolher o dono por query', () =>
    records(tokenB, '?userId=qualquer').expect(400));
});
