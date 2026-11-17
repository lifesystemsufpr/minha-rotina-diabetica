import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils/create-test-app';
import { AuthRatePolicy } from '../src/modules/auth/auth-rate-policy';

const policy: AuthRatePolicy = {
  windowSeconds: 60,
  loginIp: 1,
  loginAccount: 10,
  forgotIp: 10,
  forgotAccount: 10,
  resetIp: 10,
};

describe('Confiança em proxy (e2e)', () => {
  const original = process.env.TRUST_PROXY;
  let app: INestApplication<App> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    if (original === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = original;
  });

  it.each([
    ['1', 401],
    [undefined, 429],
  ])('com TRUST_PROXY=%s responde %s ao segundo IP', async (valor, status) => {
    if (valor === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = valor;
    app = await createTestApp([], policy);
    for (const [index, ip] of ['203.0.113.1', '203.0.113.2'].entries()) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: `proxy${index}@example.test`, senha: 'wrong-123' })
        .expect(index === 0 ? 401 : status);
    }
  });
});
