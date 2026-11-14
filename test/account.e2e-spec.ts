import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { Glicemia } from '../src/modules/glycemia/entities/glicemia.entity';
import { MomentoGlicemia } from '../src/modules/glycemia/enums/momento-glicemia.enum';
import { Perfil } from '../src/modules/users/entities/perfil.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { registerAndLogin, SENHA_TESTE } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

describe('Exclusão de conta (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const email = 'excluir@conta.local';
  let token: string;
  let userId: string;
  let tokenOutro: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DataSource);
    ({ token, userId } = await registerAndLogin(app, email, 'Pessoa Excluída'));
    tokenOutro = (await registerAndLogin(app, 'fica@conta.local')).token;

    // Um dado de saúde do usuário que será excluído.
    await db.getRepository(Glicemia).save({
      user: { id: userId },
      valor: 110,
      momento: MomentoGlicemia.JEJUM,
      dataHora: new Date('2026-10-01T08:00:00.000Z'),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE sem token retorna 401', () =>
    request(app.getHttpServer()).delete('/api/users/me').expect(401));

  it('DELETE com token exclui a conta (204)', () =>
    request(app.getHttpServer())
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(204));

  it('o token emitido antes da exclusão deixa de ser aceito', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401));

  it('a conta excluída não consegue fazer login', () =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, senha: SENHA_TESTE })
      .expect(401));

  it('apaga perfil e dados de saúde e anonimiza a conta', async () => {
    const qtd = (entity: typeof Perfil | typeof Glicemia) =>
      db
        .getRepository(entity)
        .createQueryBuilder('r')
        .where('r.usuario_id = :id', { id: userId })
        .getCount();
    expect(await qtd(Perfil)).toBe(0);
    expect(await qtd(Glicemia)).toBe(0);

    const user = await db.getRepository(User).findOneByOrFail({ id: userId });
    expect(user.ativo).toBe(false);
    expect(user.nome).not.toBe('Pessoa Excluída');
    expect(user.email).not.toBe(email);
  });

  it('o e-mail fica livre para um novo cadastro', () =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send(validRegisterPayload({ email, senha: SENHA_TESTE }))
      .expect(201));

  it('a exclusão não afeta outros usuários', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenOutro}`)
      .expect(200));
});
