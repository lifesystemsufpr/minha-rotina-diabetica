import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { Perfil } from '../src/modules/users/entities/perfil.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { createTestApp } from './utils/create-test-app';
import { validRegisterPayload } from './utils/valid-register-payload';

process.env.JWT_SECRET ??= 'segredo-somente-para-teste';
process.env.JWT_EXPIRATION ??= '15m';

describe('POST /auth/register (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const post = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send(body as object);

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cadastro válido retorna 201 com usuário + perfil, sem senha/hash', async () => {
    const res = await post(validRegisterPayload()).expect(201);
    const body = res.body as Record<string, any>;

    expect(body.id).toEqual(expect.any(String));
    expect(body.email).toBe('maria@example.com');
    expect(body.perfil).toEqual({
      dataNascimento: '1995-04-12',
      tipoDiabetes: 'TIPO_1',
      alturaCm: 170.5,
      pesoKg: 68.3,
      contatoEmergencia: {
        nome: 'João Silva',
        relacao: 'Pai',
        telefone: '(41) 99999-9999',
      },
    });
    const json = JSON.stringify(body);
    expect(json).not.toContain('senha');
    expect(json).not.toContain('$2b$');
  });

  it('persiste só o hash da senha e o perfil associado ao usuário', async () => {
    await post(
      validRegisterPayload({ email: 'persistido@example.com' }),
    ).expect(201);

    const user = await dataSource.getRepository(User).findOneOrFail({
      where: { email: 'persistido@example.com' },
      select: { id: true, senhaHash: true },
    });
    expect(user.senhaHash).not.toBe('senha-forte-123');
    expect(user.senhaHash).toMatch(/^\$2[aby]\$/);

    const perfil = await dataSource.getRepository(Perfil).findOneOrFail({
      where: { user: { id: user.id } },
    });
    expect(perfil.alturaCm).toBe(170.5);
    expect(perfil.pesoKg).toBe(68.3);
    expect(perfil.contatoEmergenciaTelefone).toBe('(41) 99999-9999');
  });

  it('normaliza o e-mail (maiúsculas e espaços)', async () => {
    const res = await post(
      validRegisterPayload({ email: '  Normal@Example.COM ' }),
    ).expect(201);
    expect((res.body as { email: string }).email).toBe('normal@example.com');
  });

  it('aceita confirmarSenha igual à senha e não o persiste nem devolve', async () => {
    const res = await post(
      validRegisterPayload({
        email: 'confirma@example.com',
        confirmarSenha: 'senha-forte-123',
      }),
    ).expect(201);
    expect(JSON.stringify(res.body)).not.toContain('confirmarSenha');
  });

  it('e-mail duplicado retorna 409 (inclusive com caixa diferente)', async () => {
    await post(validRegisterPayload({ email: 'dup@example.com' })).expect(201);
    const res = await post(
      validRegisterPayload({ email: 'DUP@example.com' }),
    ).expect(409);
    expect((res.body as ErrorResponseDto).statusCode).toBe(409);
  });

  it('e-mail duplicado não cria um segundo usuário nem perfil órfão', async () => {
    const before = await dataSource.getRepository(Perfil).count();
    await post(validRegisterPayload({ email: 'dup@example.com' })).expect(409);
    expect(await dataSource.getRepository(Perfil).count()).toBe(before);
  });

  describe('DTO inválido retorna 400', () => {
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ['e-mail inválido', { email: 'nao-e-email' }, 'email'],
      ['senha curta', { senha: '1234567' }, 'senha'],
      ['senha acima de 72 caracteres', { senha: 'a'.repeat(73) }, 'senha'],
      [
        'confirmarSenha diferente',
        { confirmarSenha: 'outra-senha-123' },
        'confirmarSenha',
      ],
      [
        'data de nascimento futura',
        { dataNascimento: '2999-01-01' },
        'dataNascimento',
      ],
      [
        'data de nascimento inexistente',
        { dataNascimento: '2020-02-30' },
        'dataNascimento',
      ],
      [
        'data de nascimento em outro formato',
        { dataNascimento: '12/04/1995' },
        'dataNascimento',
      ],
      [
        'tipo de diabetes inexistente',
        { tipoDiabetes: 'TIPO_9' },
        'tipoDiabetes',
      ],
      ['nome como objeto', { nome: { a: 1 } }, 'nome'],
      ['senha como número', { senha: 12345678 }, 'senha'],
      ['peso booleano', { pesoKg: true }, 'pesoKg'],
      ['altura como texto', { alturaCm: 'alta' }, 'alturaCm'],
      ['altura negativa', { alturaCm: -1 }, 'alturaCm'],
      ['altura acima do limite da coluna', { alturaCm: 1000 }, 'alturaCm'],
      ['peso com 3 casas decimais', { pesoKg: 68.123 }, 'pesoKg'],
      ['peso zero', { pesoKg: 0 }, 'pesoKg'],
      [
        'contato sem telefone',
        { contatoEmergencia: { nome: 'A', relacao: 'B' } },
        'contatoEmergencia.telefone',
      ],
      [
        'telefone com letras',
        {
          contatoEmergencia: {
            nome: 'A',
            relacao: 'B',
            telefone: 'abc-defg-hij',
          },
        },
        'contatoEmergencia.telefone',
      ],
    ];

    it.each(cases)('%s', async (_name, override, field) => {
      const res = await post(
        validRegisterPayload({ email: 'invalido@example.com', ...override }),
      ).expect(400);
      const body = res.body as ErrorResponseDto;
      expect(body.details?.map((d) => d.field)).toContain(field);
    });

    it('campo obrigatório ausente', async () => {
      const semNome: Record<string, unknown> = validRegisterPayload();
      delete semNome.nome;
      await post(semNome).expect(400);
    });

    it('corpo vazio', async () => {
      await post({}).expect(400);
    });

    it('propriedades extras são rejeitadas (ex.: id, isAdmin, senhaHash)', async () => {
      for (const extra of [
        { isAdmin: true },
        { id: 'forjado' },
        { senhaHash: 'x' },
      ]) {
        await post(
          validRegisterPayload({ email: 'extra@example.com', ...extra }),
        ).expect(400);
      }
      await post(
        validRegisterPayload({
          email: 'extra@example.com',
          contatoEmergencia: {
            nome: 'A',
            relacao: 'B',
            telefone: '41999999999',
            admin: 1,
          },
        }),
      ).expect(400);
    });

    it('nenhum cadastro inválido deixa usuário gravado', async () => {
      const count = await dataSource
        .getRepository(User)
        .count({ where: { email: 'invalido@example.com' } });
      expect(count).toBe(0);
    });
  });
});
