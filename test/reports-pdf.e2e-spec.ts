import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

describe('Relatório em PDF (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let userIdA: string;
  let tokenVazio: string;

  const getPdf = (auth: string | undefined, query = '') => {
    const req = request(app.getHttpServer()).get(`/api/reports/pdf${query}`);
    if (auth) req.set('Authorization', `Bearer ${auth}`);
    // 'blob' faz o supertest entregar o PDF como Buffer em res.body.
    return req.responseType('blob');
  };

  beforeAll(async () => {
    app = await createTestApp();
    ({ token, userId: userIdA } = await registerAndLogin(app, 'a@pdf.local'));
    tokenVazio = (await registerAndLogin(app, 'b@pdf.local')).token;

    await request(app.getHttpServer())
      .post('/api/glycemias')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valor: 110,
        momento: 'JEJUM',
        dataHora: '2026-10-12T08:30:00-03:00',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/insulin-applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'Rápida',
        doseUi: 10,
        localAplicacao: 'ABDOMEN',
        dataHora: '2026-10-12T08:40:00-03:00',
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token retorna 401 no formato padrão', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/pdf')
      .expect(401);
    expect((res.body as ErrorResponseDto).statusCode).toBe(401);
  });

  it('retorna um PDF válido, como attachment e com nome previsível', async () => {
    const res = await getPdf(
      token,
      '?startDate=2026-10-01&endDate=2026-10-31',
    ).expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="relatorio-rotina-diabetica_2026-10-01_a_2026-10-31.pdf"',
    );
    const body = res.body as Buffer;
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(body.subarray(-16).toString('latin1')).toContain('%%EOF');
  });

  it('usuário sem registros também recebe um PDF válido', async () => {
    const res = await getPdf(tokenVazio).expect(200);
    expect((res.body as Buffer).subarray(0, 5).toString('latin1')).toBe(
      '%PDF-',
    );
  });

  it('período inválido retorna 400 em JSON no padrão da API', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/pdf?startDate=2026-10-31&endDate=2026-10-01')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(res.headers['content-type']).toContain('application/json');
    expect((res.body as ErrorResponseDto).statusCode).toBe(400);
  });

  it('expõe tamanho, tipo e nome do arquivo nos headers', async () => {
    const res = await getPdf(token).expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio-rotina-diabetica_.+\.pdf"$/,
    );
    expect(res.headers['content-length']).toBe(
      String((res.body as Buffer).length),
    );
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('não aceita pedir o relatório de outro usuário por parâmetro', async () => {
    const res = await getPdf(tokenVazio, `?userId=${userIdA}`).expect(400);
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('libera o Content-Disposition para clientes web (CORS)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/pdf')
      .set('Authorization', `Bearer ${token}`)
      .set('Origin', 'http://localhost:8081')
      .responseType('blob')
      .expect(200);

    expect(res.headers['access-control-expose-headers']).toContain(
      'Content-Disposition',
    );
  });
});