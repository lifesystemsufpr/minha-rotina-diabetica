import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HomeSummaryResponseDto } from '../src/modules/home/dto/home-summary-response.dto';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

// Datas relativas ao dia local de hoje, para o "hoje" e os "últimos 7 dias"
// da API baterem com os do teste em qualquer fuso.
function diaLocal(diasAtras: number, hora: number, segundo = 0): string {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  data.setHours(hora, 0, segundo, 0);
  return data.toISOString();
}

describe('Home (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenVazio: string;

  const http = () => request(app.getHttpServer());
  const summary = (token?: string) => {
    const req = http().get('/api/home/summary');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };
  const post = async (token: string, rota: string, body: object) =>
    (
      await http()
        .post(`/api/${rota}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201)
    ).body as { id: string };

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@home.local', 'Maria')).token;
    tokenB = (await registerAndLogin(app, 'b@home.local', 'Joana')).token;
    tokenVazio = (await registerAndLogin(app, 'c@home.local', 'Sem Dados'))
      .token;

    // Glicemias da A: uma fora do gráfico (10 dias), uma há 2 dias e a de
    // hoje bem cedo (00:00:30), que é a mais recente.
    for (const [valor, dataHora] of [
      [90, diaLocal(10, 12)],
      [200, diaLocal(2, 12)],
      [110, diaLocal(0, 0, 30)],
    ] as const) {
      await post(tokenA, 'glycemias', { valor, momento: 'JEJUM', dataHora });
    }
    // Insulina da A: a última foi ontem, então hoje não houve aplicação.
    await post(tokenA, 'insulin-applications', {
      tipo: 'Basal',
      doseUi: 20,
      localAplicacao: 'COXA',
      dataHora: diaLocal(3, 12),
    });
    await post(tokenA, 'insulin-applications', {
      tipo: 'Rápida',
      doseUi: 8,
      localAplicacao: 'ABDOMEN',
      dataHora: diaLocal(1, 12),
    });

    // Lembretes da A: o próximo ativo é amanhã às 21h. O de amanhã às 8h
    // está INATIVO e o de ontem já passou.
    await post(tokenA, 'reminders', {
      titulo: 'Insulina da noite',
      dataHora: diaLocal(-1, 21),
    });
    const inativo = await post(tokenA, 'reminders', {
      titulo: 'Desativado',
      dataHora: diaLocal(-1, 8),
    });
    await http()
      .patch(`/api/reminders/${inativo.id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'INATIVO' })
      .expect(200);
    await post(tokenA, 'reminders', {
      titulo: 'Atrasado',
      dataHora: diaLocal(1, 8),
    });

    // Outra usuária, com registros que não podem aparecer para a A.
    await post(tokenB, 'glycemias', {
      valor: 300,
      momento: 'JEJUM',
      dataHora: diaLocal(0, 0, 30),
    });
    await post(tokenB, 'insulin-applications', {
      tipo: 'Mista',
      doseUi: 12,
      localAplicacao: 'BRACO',
      dataHora: diaLocal(0, 0, 30),
    });
    await post(tokenB, 'reminders', {
      titulo: 'Da Joana',
      dataHora: diaLocal(-1, 7),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token responde 401', () => summary().expect(401));

  it('usuária sem registros recebe 200 com null, false e lista vazia', async () => {
    const body = (await summary(tokenVazio).expect(200))
      .body as HomeSummaryResponseDto;

    expect(body).toEqual({
      nome: 'Sem Dados',
      ultimaGlicemia: null,
      ultimaInsulina: null,
      proximoLembrete: null,
      resumoDiario: { glicemiaRegistrada: false, insulinaRegistrada: false },
      glicemiaUltimos7Dias: [],
    });
  });

  it('traz a última glicemia e a última insulina da usuária', async () => {
    const body = (await summary(tokenA).expect(200))
      .body as HomeSummaryResponseDto;

    expect(body.nome).toBe('Maria');
    expect(body.ultimaGlicemia).toMatchObject({ valor: 110, status: 'NORMAL' });
    expect(body.ultimaInsulina).toMatchObject({ tipo: 'Rápida', doseUi: 8 });
  });

  it('próximo lembrete: só ATIVO e que ainda não passou', async () => {
    const body = (await summary(tokenA).expect(200))
      .body as HomeSummaryResponseDto;

    expect(body.proximoLembrete).toMatchObject({
      titulo: 'Insulina da noite',
      status: 'ATIVO',
    });
  });

  it('resumo do dia e gráfico dos últimos 7 dias', async () => {
    const body = (await summary(tokenA).expect(200))
      .body as HomeSummaryResponseDto;

    expect(body.resumoDiario).toEqual({
      glicemiaRegistrada: true,
      insulinaRegistrada: false,
    });
    // A task pede o resumo só de glicemia e insulina.
    const texto = JSON.stringify(body).toLowerCase();
    expect(texto).not.toContain('aliment');
    expect(texto).not.toContain('exerc');

    // Do mais antigo para o mais novo; a de 10 dias fica de fora.
    expect(body.glicemiaUltimos7Dias.map((p) => p.valor)).toEqual([200, 110]);
  });

  it('cada usuária vê só os próprios dados', async () => {
    const body = (await summary(tokenB).expect(200))
      .body as HomeSummaryResponseDto;

    expect(body.nome).toBe('Joana');
    expect(body.ultimaGlicemia?.valor).toBe(300);
    expect(body.ultimaInsulina?.tipo).toBe('Mista');
    expect(body.proximoLembrete?.titulo).toBe('Da Joana');
    expect(body.resumoDiario).toEqual({
      glicemiaRegistrada: true,
      insulinaRegistrada: true,
    });
    expect(body.glicemiaUltimos7Dias).toHaveLength(1);
  });

  it('registros com data futura não contam como último, de hoje nem no gráfico', async () => {
    const { token } = await registerAndLogin(app, 'futuro@home.local', 'Lia');
    const minutos = (m: number) =>
      new Date(Date.now() + m * 60_000).toISOString();
    await post(token, 'glycemias', {
      valor: 120,
      momento: 'JEJUM',
      dataHora: minutos(-2),
    });
    await post(token, 'glycemias', {
      valor: 333,
      momento: 'JEJUM',
      dataHora: minutos(3),
    });
    await post(token, 'insulin-applications', {
      tipo: 'Basal',
      doseUi: 10,
      localAplicacao: 'COXA',
      dataHora: minutos(3),
    });

    const body = (await summary(token).expect(200))
      .body as HomeSummaryResponseDto;

    expect(body.ultimaGlicemia?.valor).toBe(120);
    expect(body.ultimaInsulina).toBeNull();
    expect(body.resumoDiario.insulinaRegistrada).toBe(false);
    expect(body.glicemiaUltimos7Dias.map((p) => p.valor)).toEqual([120]);
  });

  it('ignora qualquer tentativa de escolher o usuário pela URL', async () => {
    const body = (
      await http()
        .get('/api/home/summary?userId=qualquer&usuarioId=qualquer')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200)
    ).body as HomeSummaryResponseDto;
    expect(body.nome).toBe('Joana');
  });
});
