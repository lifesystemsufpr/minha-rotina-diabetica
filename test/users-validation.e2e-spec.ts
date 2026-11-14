import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { createTestApp } from './utils/create-test-app';

describe('Users validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const validPayload = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    birthDate: '1995-04-12',
  };

  it('deve aceitar um payload válido (201)', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send(validPayload)
      .expect(201);
  });

  it('deve retornar 400 quando um campo obrigatório está ausente', () => {
    const payloadSemEmail = {
      name: validPayload.name,
      birthDate: validPayload.birthDate,
    };
    return request(app.getHttpServer())
      .post('/api/users')
      .send(payloadSemEmail)
      .expect(400);
  });

  it('deve retornar 400 quando o e-mail é inválido', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({ ...validPayload, email: 'nao-e-email' })
      .expect(400);
  });

  it('deve retornar 400 quando há campo extra não permitido pelo DTO', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({ ...validPayload, isAdmin: true })
      .expect(400);
  });

  it('deve listar em details cada campo inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({ name: 'ab', email: 'x', birthDate: 'nao-e-data' })
      .expect(400);

    const body = res.body as ErrorResponseDto;
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Erro de validação');
    expect(body.path).toBe('/api/users');
    expect(body.details?.map((d) => d.field).sort()).toEqual([
      'birthDate',
      'email',
      'name',
    ]);
    for (const detail of body.details ?? []) {
      expect(detail.messages.length).toBeGreaterThan(0);
    }
  });
});
