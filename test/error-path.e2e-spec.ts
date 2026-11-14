import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { createTestApp } from './utils/create-test-app';

// Rota usada só no teste, para simular uma falha inesperada.
@Controller('test-errors')
class ThrowingController {
  @Get('unexpected')
  unexpected(): never {
    throw new Error('falha interna: senha do banco incorreta');
  }
}

describe('AllExceptionsFilter (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp([ThrowingController]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('não devolve a query string no campo path', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/naoexiste?token=SEGREDO123')
      .expect(404);

    const body = res.body as ErrorResponseDto;
    expect(body.path).toBe('/api/naoexiste');
    expect(JSON.stringify(body)).not.toContain('SEGREDO123');
    expect(JSON.stringify(body)).not.toContain('token=');
  });

  it('mantém o path normal quando não há query string', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/naoexiste')
      .expect(404);

    expect((res.body as ErrorResponseDto).path).toBe('/api/naoexiste');
  });

  it('responde 500 genérico sem expor detalhes internos', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/test-errors/unexpected')
      .expect(500);

    const body = res.body as ErrorResponseDto;
    expect(body.statusCode).toBe(500);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe(
      'Erro interno do servidor. Tente novamente mais tarde.',
    );
    expect(JSON.stringify(body)).not.toContain('senha do banco');
    expect(JSON.stringify(body)).not.toContain('stack');
  });

  it('responde JSON malformado no formato padrão', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{malformado')
      .expect(400);

    const body = res.body as ErrorResponseDto;
    expect(body.statusCode).toBe(400);
    expect(body.path).toBe('/api/users');
  });
});
