import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('AllExceptionsFilter - campo path (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('não devolve a query string no campo path', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/naoexiste?token=SEGREDO123')
      .expect(404);

    expect(res.body.path).toBe('/api/naoexiste');
    expect(JSON.stringify(res.body)).not.toContain('SEGREDO123');
    expect(JSON.stringify(res.body)).not.toContain('token=');
  });

  it('mantém o path normal quando não há query string', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/naoexiste')
      .expect(404);

    expect(res.body.path).toBe('/api/naoexiste');
  });
});