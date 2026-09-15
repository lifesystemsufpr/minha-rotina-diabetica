import { afterAll, beforeAll, describe, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
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
      .post('/users')
      .send(validPayload)
      .expect(201);
  });

  it('deve retornar 400 quando um campo obrigatório está ausente', () => {
    const { email, ...rest } = validPayload;
    return request(app.getHttpServer()).post('/users').send(rest).expect(400);
  });

  it('deve retornar 400 quando o e-mail é inválido', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ ...validPayload, email: 'nao-e-email' })
      .expect(400);
  });

  it('deve retornar 400 quando há campo extra não permitido pelo DTO', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ ...validPayload, isAdmin: true })
      .expect(400);
  });
});