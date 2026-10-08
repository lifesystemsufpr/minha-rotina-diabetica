import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';

export const SENHA_TESTE = 'senhaForte123';

// Cadastra e faz login de um usuário de teste; devolve o token e o id (sub).
export async function registerAndLogin(
  app: INestApplication<App>,
  email: string,
  nome = 'Usuária Teste',
): Promise<{ token: string; userId: string }> {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ nome, email, senha: SENHA_TESTE })
    .expect(201);

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, senha: SENHA_TESTE })
    .expect(200);

  const token = (res.body as { accessToken: string }).accessToken;
  const { sub } = app.get(JwtService).decode<{ sub: string }>(token);
  return { token, userId: sub };
}
