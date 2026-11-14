import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { ProfileResponseDto } from '../src/modules/profile/dto/profile-response.dto';
import { Perfil } from '../src/modules/users/entities/perfil.entity';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

// O cadastro (POST /auth/register) já cria o perfil com os dados de
// test/utils/valid-register-payload.ts.
describe('Profile (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenSemPerfil: string;

  beforeAll(async () => {
    app = await createTestApp();
    tokenA = (await registerAndLogin(app, 'a@perfil.local', 'Ana')).token;
    tokenB = (await registerAndLogin(app, 'b@perfil.local', 'Bia')).token;

    // Usuário sem perfil (dado legado): o perfil é removido direto no banco.
    const semPerfil = await registerAndLogin(app, 'c@perfil.local');
    tokenSemPerfil = semPerfil.token;
    await app
      .get(DataSource)
      .createQueryBuilder()
      .delete()
      .from(Perfil)
      .where('usuario_id = :id', { id: semPerfil.userId })
      .execute();
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (token: string) =>
    request(app.getHttpServer())
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
  const patch = (token: string, body: object) =>
    request(app.getHttpServer())
      .patch('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('GET sem token retorna 401', () =>
    request(app.getHttpServer()).get('/api/profile').expect(401));

  it('GET devolve o perfil do dono do token, sem dados sensíveis', async () => {
    const body = (await get(tokenA).expect(200)).body as ProfileResponseDto;

    expect(body.nome).toBe('Ana');
    expect(body.dataNascimento).toBe('1995-04-12');
    expect(typeof body.idade).toBe('number');
    expect(body.alturaCm).toBe(170.5);
    expect(body.pesoKg).toBe(68.3);
    expect(body.tipoDiabetes).toBe('TIPO_1');
    expect(body.contatoEmergencia).toEqual({
      nome: 'João Silva',
      relacao: 'Pai',
      telefone: '(41) 99999-9999',
    });
    expect(JSON.stringify(body)).not.toMatch(/senha|hash/i);
  });

  it('cada usuário recebe o próprio perfil', async () => {
    const body = (await get(tokenB).expect(200)).body as ProfileResponseDto;
    expect(body.nome).toBe('Bia');
  });

  it('GET sem perfil retorna 404 no formato padrão', async () => {
    const res = await get(tokenSemPerfil).expect(404);
    expect((res.body as ErrorResponseDto).statusCode).toBe(404);
  });

  it('PATCH altera só os campos enviados', async () => {
    const body = (await patch(tokenA, { pesoKg: 60 }).expect(200))
      .body as ProfileResponseDto;
    expect(body.pesoKg).toBe(60);
    expect(body.alturaCm).toBe(170.5);
    expect(body.contatoEmergencia?.nome).toBe('João Silva');
  });

  it('PATCH atualiza o contato de emergência completo', async () => {
    await patch(tokenA, {
      contatoEmergencia: {
        nome: 'Carla Souza',
        relacao: 'Mãe',
        telefone: '(11) 98888-7777',
      },
    }).expect(200);

    const body = (await get(tokenA).expect(200)).body as ProfileResponseDto;
    expect(body.contatoEmergencia).toEqual({
      nome: 'Carla Souza',
      relacao: 'Mãe',
      telefone: '(11) 98888-7777',
    });
  });

  it('PATCH recusa contato de emergência incompleto', async () => {
    const res = await patch(tokenA, {
      contatoEmergencia: { nome: 'Só nome' },
    }).expect(400);
    const fields = (res.body as ErrorResponseDto).details?.map((d) => d.field);
    expect(fields).toContain('contatoEmergencia.relacao');
  });

  it('PATCH com dado inválido retorna 400 com details', async () => {
    const res = await patch(tokenA, { alturaCm: -10 }).expect(400);
    const fields = (res.body as ErrorResponseDto).details?.map((d) => d.field);
    expect(fields).toContain('alturaCm');
  });

  it('PATCH recusa data de nascimento futura', async () => {
    const res = await patch(tokenA, { dataNascimento: '2999-01-01' }).expect(
      400,
    );
    const fields = (res.body as ErrorResponseDto).details?.map((d) => d.field);
    expect(fields).toContain('dataNascimento');
  });

  it('PATCH não permite alterar e-mail nem escolher o dono', async () => {
    await patch(tokenA, { email: 'novo@perfil.local' }).expect(400);
    await patch(tokenA, { usuarioId: 'outro-id' }).expect(400);
  });

  it('PATCH sem token retorna 401', () =>
    request(app.getHttpServer())
      .patch('/api/profile')
      .send({ pesoKg: 70 })
      .expect(401));
});
