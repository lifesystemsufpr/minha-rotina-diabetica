import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { CreateProfileDto } from '../src/modules/profile/dto/create-profile.dto';
import { ProfileResponseDto } from '../src/modules/profile/dto/profile-response.dto';
import { ProfileService } from '../src/modules/profile/profile.service';
import { TipoDiabetes } from '../src/modules/users/enums/tipo-diabetes.enum';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

// O cadastro ainda não cria o perfil (task "Cadastrar usuário", pendente),
// então os testes criam o perfil direto pelo ProfileService.
const perfilCompleto: CreateProfileDto = {
  dataNascimento: '1995-04-12',
  tipoDiabetes: TipoDiabetes.TIPO_1,
  alturaCm: 165.5,
  pesoKg: 62.3,
  contatoEmergenciaNome: 'João Silva',
  contatoEmergenciaRelacao: 'Irmão',
  contatoEmergenciaTelefone: '+5541999998888',
};

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let tokenSemPerfil: string;

  beforeAll(async () => {
    app = await createTestApp();
    const profiles = app.get(ProfileService);

    const a = await registerAndLogin(app, 'a@perfil.local', 'Ana');
    const b = await registerAndLogin(app, 'b@perfil.local', 'Bia');
    const semPerfil = await registerAndLogin(app, 'c@perfil.local');
    tokenA = a.token;
    tokenB = b.token;
    tokenSemPerfil = semPerfil.token;

    await profiles.create(perfilCompleto, a.userId);
    // Perfil com campos opcionais vazios
    await profiles.create(
      { tipoDiabetes: TipoDiabetes.TIPO_2 } as CreateProfileDto,
      b.userId,
    );
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
    const res = await get(tokenA).expect(200);
    const body = res.body as ProfileResponseDto;

    expect(body.nome).toBe('Ana');
    expect(typeof body.idade).toBe('number');
    expect(body.alturaCm).toBe(165.5);
    expect(body.pesoKg).toBe(62.3);
    expect(body.tipoDiabetes).toBe(TipoDiabetes.TIPO_1);
    expect(body.contatoEmergenciaNome).toBe('João Silva');
    expect(JSON.stringify(body)).not.toMatch(/senha|hash/i);
  });

  it('cada usuário recebe o próprio perfil', async () => {
    const res = await get(tokenB).expect(200);
    expect((res.body as ProfileResponseDto).nome).toBe('Bia');
  });

  it('campos opcionais vazios voltam como null, não como 0', async () => {
    const body = (await get(tokenB).expect(200)).body as ProfileResponseDto;
    expect(body.idade).toBeNull();
    expect(body.alturaCm).toBeNull();
    expect(body.pesoKg).toBeNull();
    expect(body.contatoEmergenciaTelefone).toBeNull();
  });

  it('GET sem perfil retorna 404 no formato padrão', async () => {
    const res = await get(tokenSemPerfil).expect(404);
    expect((res.body as ErrorResponseDto).statusCode).toBe(404);
  });

  it('PATCH altera só os campos enviados', async () => {
    const res = await patch(tokenA, { pesoKg: 60 }).expect(200);
    const body = res.body as ProfileResponseDto;
    expect(body.pesoKg).toBe(60);
    expect(body.alturaCm).toBe(165.5);
  });

  it('PATCH atualiza o contato de emergência completo', async () => {
    await patch(tokenA, {
      contatoEmergenciaNome: 'Carla Souza',
      contatoEmergenciaRelacao: 'Mãe',
      contatoEmergenciaTelefone: '+5511988887777',
    }).expect(200);

    const body = (await get(tokenA).expect(200)).body as ProfileResponseDto;
    expect(body.contatoEmergenciaNome).toBe('Carla Souza');
    expect(body.contatoEmergenciaRelacao).toBe('Mãe');
    expect(body.contatoEmergenciaTelefone).toBe('+5511988887777');
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
