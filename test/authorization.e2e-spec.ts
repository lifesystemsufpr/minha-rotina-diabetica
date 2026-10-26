import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import {
  Controller,
  Get,
  INestApplication,
  RequestMethod,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from '../src/common/dto/error-response.dto';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../src/modules/auth/decorators/current-user.decorator';
import { registerAndLogin } from './utils/auth-helpers';
import { createTestApp } from './utils/create-test-app';

const UUID = '5b6c1f7e-1d2b-4c3a-9f8e-123456789abc';

// Rotas que PODEM ser públicas. Qualquer rota fora desta lista precisa do
// JwtAuthGuard, senão o teste falha (protege rotas novas de outras pessoas).
const ROTAS_PUBLICAS = new Set([
  'GET /',
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/forgot-password',
  'POST /auth/reset-password',
]);

// Rota usada só neste teste: usa @CurrentUser SEM o guard, para provar que
// esquecer o guard falha fechado (401) em vez de vazar dados.
@Controller('test-authz')
class SemGuardController {
  @Get('sem-guard')
  semGuard(@CurrentUser('id') userId: string) {
    return { userId };
  }
}

interface Rota {
  metodo: string;
  caminho: string;
  protegida: boolean;
}

function juntar(...partes: string[]): string {
  const caminho = ('/' + partes.join('/')).replace(/\/+/g, '/');
  return caminho.length > 1 ? caminho.replace(/\/$/, '') : caminho;
}

// Lê os controllers registrados e diz quais rotas têm JwtAuthGuard
// (no controller inteiro ou no método).
function listarRotas(app: INestApplication<App>): Rota[] {
  const rotas: Rota[] = [];
  const modules = app.get(ModulesContainer);
  for (const modulo of modules.values()) {
    for (const wrapper of modulo.controllers.values()) {
      const controller = wrapper.metatype;
      if (!controller || controller === SemGuardController) continue;

      const base = Reflect.getMetadata(PATH_METADATA, controller) as string;
      const guardsClasse =
        (Reflect.getMetadata(GUARDS_METADATA, controller) as unknown[]) ?? [];

      for (const nome of Object.getOwnPropertyNames(controller.prototype)) {
        const handler = (controller.prototype as Record<string, object>)[nome];
        const metodo = Reflect.getMetadata(METHOD_METADATA, handler) as
          RequestMethod | undefined;
        if (metodo === undefined) continue;

        const sub = Reflect.getMetadata(PATH_METADATA, handler) as string;
        const guardsMetodo =
          (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[]) ?? [];
        rotas.push({
          metodo: RequestMethod[metodo],
          caminho: juntar(base ?? '', sub ?? ''),
          protegida: [...guardsClasse, ...guardsMetodo].includes(JwtAuthGuard),
        });
      }
    }
  }
  return rotas;
}

// Percorre o JSON inteiro procurando chaves sensíveis.
function chavesSensiveis(valor: unknown, achadas: string[] = []): string[] {
  if (Array.isArray(valor)) {
    valor.forEach((v) => chavesSensiveis(v, achadas));
  } else if (valor && typeof valor === 'object') {
    for (const [chave, v] of Object.entries(valor)) {
      if (/senha|hash|password/i.test(chave)) achadas.push(chave);
      chavesSensiveis(v, achadas);
    }
  }
  return achadas;
}

describe('Autorização das rotas privadas (e2e)', () => {
  let app: INestApplication<App>;
  let rotas: Rota[];
  let tokenA: string;
  let tokenB: string;
  let userIdA: string;
  let glicemiaA: string;
  let insulinaA: string;

  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => `Bearer ${token}`;

  beforeAll(async () => {
    app = await createTestApp([SemGuardController]);
    rotas = listarRotas(app);

    ({ token: tokenA, userId: userIdA } = await registerAndLogin(
      app,
      'autz-a@teste.local',
      'Usuária A',
    ));
    ({ token: tokenB } = await registerAndLogin(
      app,
      'autz-b@teste.local',
      'Usuária B',
    ));

    const g = await http()
      .post('/api/glycemias')
      .set('Authorization', bearer(tokenA))
      .send({
        valor: 110,
        momento: 'JEJUM',
        dataHora: '2026-10-01T08:00:00.000Z',
        observacao: 'segredo da A',
      })
      .expect(201);
    glicemiaA = (g.body as { id: string }).id;

    const i = await http()
      .post('/api/insulin-applications')
      .set('Authorization', bearer(tokenA))
      .send({
        tipo: 'Rápida',
        doseUi: 8,
        localAplicacao: 'ABDOMEN',
        dataHora: '2026-10-01T08:05:00.000Z',
        observacao: 'segredo da A',
      })
      .expect(201);
    insulinaA = (i.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('inventário de rotas e uso do guard', () => {
    it('encontra as rotas dos módulos', () => {
      expect(rotas.length).toBeGreaterThan(10);
      const chaves = rotas.map((r) => `${r.metodo} ${r.caminho}`);
      expect(chaves).toContain('GET /glycemias/:id');
      expect(chaves).toContain('PATCH /insulin-applications/:id');
      expect(chaves).toContain('DELETE /users/me');
    });

    it('toda rota fora da lista pública usa JwtAuthGuard', () => {
      const semGuard = rotas
        .filter((r) => !r.protegida)
        .map((r) => `${r.metodo} ${r.caminho}`)
        .filter((chave) => !ROTAS_PUBLICAS.has(chave));
      expect(semGuard).toEqual([]);
    });

    it('as rotas públicas da lista existem e não usam guard sem querer', () => {
      const publicas = rotas
        .filter((r) => !r.protegida)
        .map((r) => `${r.metodo} ${r.caminho}`)
        .sort();
      expect(publicas).toEqual([...ROTAS_PUBLICAS].sort());
    });
  });

  describe('sem autenticação', () => {
    it('toda rota privada responde 401 sem token, no formato padrão', async () => {
      const privadas = rotas.filter((r) => r.protegida);
      expect(privadas.length).toBeGreaterThan(0);

      for (const r of privadas) {
        const caminho = '/api' + r.caminho.replace(/:[^/]+/g, UUID);
        const res = await http()
          [r.metodo.toLowerCase() as 'get'](caminho)
          .expect(401);
        const body = res.body as ErrorResponseDto;
        expect([r.metodo, r.caminho, body.statusCode]).toEqual([
          r.metodo,
          r.caminho,
          401,
        ]);
        expect(body.error).toBe('Unauthorized');
        expect(body.path).toBe(caminho);
      }
    });

    it('rota que usa @CurrentUser sem o guard falha fechada (401)', () =>
      http().get('/api/test-authz/sem-guard').expect(401));
  });

  describe('tokens inválidos', () => {
    const jwt = () => app.get(JwtService);
    const get = (authorization: string) =>
      http().get('/api/glycemias').set('Authorization', authorization);

    it('header sem token ou com esquema errado', async () => {
      await get('Bearer').expect(401);
      await get(`Basic ${tokenA}`).expect(401);
      await get(tokenA).expect(401);
    });

    it('token malformado', () => get('Bearer token.invalido.aqui').expect(401));

    it('token expirado', async () => {
      const expirado = jwt().sign({ sub: userIdA }, { expiresIn: '-10s' });
      await get(bearer(expirado)).expect(401);
    });

    it('token assinado com outro segredo', async () => {
      const falso = jwt().sign({ sub: userIdA }, { secret: 'outro-segredo' });
      await get(bearer(falso)).expect(401);
    });

    it('token sem assinatura (alg none)', async () => {
      const b64 = (o: object) =>
        Buffer.from(JSON.stringify(o)).toString('base64url');
      const semAssinatura = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: userIdA })}.`;
      await get(bearer(semAssinatura)).expect(401);
    });

    it('token válido de usuário que não existe', async () => {
      const orfao = jwt().sign({ sub: UUID });
      await get(bearer(orfao)).expect(401);
    });

    it('token sem o campo sub', async () => {
      const semSub = jwt().sign({ foo: 'bar' });
      await get(bearer(semSub)).expect(401);
    });
  });

  describe('usuário B tentando acessar registros da usuária A', () => {
    const comoB = () => ({
      get: (url: string) =>
        http().get(url).set('Authorization', bearer(tokenB)),
      patch: (url: string) =>
        http().patch(url).set('Authorization', bearer(tokenB)),
      delete: (url: string) =>
        http().delete(url).set('Authorization', bearer(tokenB)),
    });

    it.each([
      ['glycemias', () => glicemiaA, { valor: 300 }],
      ['insulin-applications', () => insulinaA, { doseUi: 99 }],
    ])(
      '%s: GET, PATCH e DELETE de outro usuário retornam 404',
      async (rota, id, patch) => {
        const url = `/api/${rota}/${id()}`;
        const b = comoB();

        for (const res of [
          await b.get(url).expect(404),
          await b.patch(url).send(patch).expect(404),
          await b.delete(url).expect(404),
        ]) {
          const body = res.body as ErrorResponseDto;
          expect(body.statusCode).toBe(404);
          expect(body.error).toBe('Not Found');
          // não revela de quem é o registro nem que ele existe
          expect(JSON.stringify(body)).not.toContain('segredo da A');
        }

        // o registro da A continua intacto
        const dono = await http()
          .get(url)
          .set('Authorization', bearer(tokenA))
          .expect(200);
        expect(JSON.stringify(dono.body)).toContain('segredo da A');
      },
    );

    it('a listagem de B não traz registros da A', async () => {
      for (const rota of ['glycemias', 'insulin-applications']) {
        const res = await comoB().get(`/api/${rota}`).expect(200);
        expect(res.body).toEqual([]);
      }
    });

    it('B não consegue escolher o dono por body nem por query', async () => {
      const auth = { Authorization: bearer(tokenB) };
      await http()
        .post('/api/glycemias')
        .set(auth)
        .send({
          valor: 100,
          momento: 'JEJUM',
          dataHora: '2026-10-02T08:00:00.000Z',
          usuarioId: userIdA,
        })
        .expect(400);
      await http()
        .post('/api/insulin-applications')
        .set(auth)
        .send({
          tipo: 'Rápida',
          doseUi: 5,
          localAplicacao: 'COXA',
          dataHora: '2026-10-02T08:00:00.000Z',
          userId: userIdA,
        })
        .expect(400);
      await comoB().get(`/api/glycemias?userId=${userIdA}`).expect(400);

      // nada foi gravado na conta da A
      const lista = await http()
        .get('/api/glycemias')
        .set('Authorization', bearer(tokenA))
        .expect(200);
      expect(lista.body).toHaveLength(1);
    });

    it('registros criados por B pertencem a B', async () => {
      const criada = await comoB().get('/api/glycemias').expect(200);
      expect(criada.body).toEqual([]);

      await http()
        .post('/api/glycemias')
        .set('Authorization', bearer(tokenB))
        .send({
          valor: 90,
          momento: 'JEJUM',
          dataHora: '2026-10-03T08:00:00.000Z',
        })
        .expect(201);

      const deA = await http()
        .get('/api/glycemias')
        .set('Authorization', bearer(tokenA))
        .expect(200);
      expect(deA.body).toHaveLength(1);
    });

    it('/users/me e /profile sempre devolvem o dono do token', async () => {
      const me = await comoB()
        .get(`/api/users/me?id=${userIdA}&userId=${userIdA}`)
        .expect(200);
      expect((me.body as { nome: string }).nome).toBe('Usuária B');
      expect((me.body as { id: string }).id).not.toBe(userIdA);

      const perfil = await comoB()
        .get(`/api/profile?usuarioId=${userIdA}`)
        .expect(200);
      expect((perfil.body as { nome: string }).nome).toBe('Usuária B');
    });
  });

  describe('campos sensíveis', () => {
    it('nenhuma resposta de rota privada ou de auth traz senha/hash', async () => {
      const auth = { Authorization: bearer(tokenA) };
      const respostas = [
        await http().get('/api/users/me').set(auth),
        await http().get('/api/profile').set(auth),
        await http().patch('/api/profile').set(auth).send({ pesoKg: 70 }),
        await http().get('/api/glycemias').set(auth),
        await http().get(`/api/glycemias/${glicemiaA}`).set(auth),
        await http().get('/api/insulin-applications').set(auth),
        await http().get(`/api/insulin-applications/${insulinaA}`).set(auth),
        await http()
          .post('/api/auth/login')
          .send({ email: 'autz-a@teste.local', senha: 'senhaForte123' }),
        await http().get('/api/glycemias/nao-e-uuid').set(auth),
      ];

      for (const res of respostas) {
        expect(chavesSensiveis(res.body)).toEqual([]);
        expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/); // formato bcrypt
      }
    });
  });
});