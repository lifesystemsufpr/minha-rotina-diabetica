import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

// Garante as variáveis mesmo que não exista um .env no ambiente de teste
process.env.JWT_SECRET ??= 'segredo-somente-para-teste';
process.env.JWT_EXPIRATION ??= '15m';

interface LoginBody {
  accessToken: string;
}
interface UserBody {
  email?: string;
  senha?: unknown;
  senhaHash?: unknown;
}

describe('Auth + rota protegida', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const email = 'auth@teste.local';
  const senha = 'senha-forte-123';
  let accessToken: string;

  const decode = (token: string): Record<string, unknown> => jwt.decode(token);
  const subOf = (token: string): string => decode(token).sub as string;

  beforeAll(async () => {
    app = await createTestApp();
    jwt = app.get(JwtService);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegisterPayload({ nome: 'Teste', email, senha }))
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, senha })
      .expect(200);
    accessToken = (res.body as LoginBody).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('token válido libera /users/me', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200));

  it('sem token retorna 401', () =>
    request(app.getHttpServer()).get('/api/users/me').expect(401));

  it('token adulterado retorna 401', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken.slice(0, -2)}xx`)
      .expect(401));

  it('token expirado retorna 401', () => {
    const expired = jwt.sign({ sub: subOf(accessToken) }, { expiresIn: '-1s' });
    return request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
  });

  it('payload não contém dados sensíveis', () => {
    expect(Object.keys(decode(accessToken)).sort()).toEqual([
      'exp',
      'iat',
      'sub',
    ]);
  });

  it('senha errada retorna 401', () =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, senha: 'errada-123' })
      .expect(401));

  it('register não retorna senha nem hash', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(
        validRegisterPayload({
          nome: 'Outro',
          email: 'outro@teste.local',
          senha: 'senha-forte-123',
        }),
      )
      .expect(201);
    const body = res.body as UserBody;
    expect(body).not.toHaveProperty('senha');
    expect(body).not.toHaveProperty('senhaHash');
  });

  it('/users/me não expõe hash e devolve o dono do token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = res.body as UserBody;
    expect(body.email).toBe(email);
    expect(body).not.toHaveProperty('senhaHash');
    expect(body).not.toHaveProperty('senha');
  });

  it('esquema diferente de Bearer retorna 401', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Basic ${accessToken}`)
      .expect(401));

  it('token assinado com outro secret retorna 401', () => {
    const forged = jwt.sign(
      { sub: subOf(accessToken) },
      { secret: 'outro-secret-qualquer' },
    );
    return request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${forged}`)
      .expect(401);
  });

  it('o id do dono vem do token, não da query', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me?userId=999')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect((res.body as UserBody).email).toBe(email);
  });
});
