import 'dotenv/config';
import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { HomeController } from '../src/modules/home/home.controller';
import { HomeService } from '../src/modules/home/home.service';

// Evita o erro de ES Module: o Jest não carrega o @nestjs/passport.
jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class {},
}));

jest.setTimeout(30000);

// Tipos usados no teste (evitam "any" e os erros do eslint no-unsafe-*)
interface RequisicaoFake {
  headers: Record<string, string | undefined>;
  user?: { id?: string };
}

interface ResumoBody {
  nome: string | null;
  ultimaGlicemia: { id: string; valor: number } | null;
  ultimaInsulina: { id: string; doseUi: number } | null;
  proximoLembrete: { id: string; titulo: string } | null;
  resumoDiario: { glicemiaRegistrada: boolean; insulinaRegistrada: boolean };
  glicemiaUltimos7Dias: { dataHora: string; valor: number }[];
}

// Guard de mentira: sem Authorization dá 401. O header x-user define o usuário.
const fakeGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<RequisicaoFake>();
    if (!req.headers.authorization) throw new UnauthorizedException();
    req.user = { id: req.headers['x-user'] };
    return true;
  },
};

describe('GET /home/summary', () => {
  let app: INestApplication;
  let db: DataSource;

  const servidor = () => app.getHttpServer() as App;

  const resumo = (usuario: string) =>
    request(servidor())
      .get('/home/summary')
      .set('Authorization', 'Bearer token')
      .set('x-user', usuario);

  beforeAll(async () => {
    db = new DataSource({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });
    await db.initialize();

    const moduleRef = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [HomeService, { provide: DataSource, useValue: db }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(fakeGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await db.query(`
      CREATE TABLE IF NOT EXISTS lembretes (
        id         VARCHAR(36)  NOT NULL,
        usuario_id VARCHAR(36)  NOT NULL,
        titulo     VARCHAR(255) NOT NULL,
        data_hora  DATETIME     NOT NULL,
        status     ENUM('ativo', 'inativo', 'concluido') NOT NULL DEFAULT 'ativo',
        created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id) )
    `);

    // limpa os dados antigos (filhos primeiro, por causa das chaves estrangeiras)
    await db.query("DELETE FROM lembretes WHERE usuario_id LIKE 'home-%'");
    await db.query("DELETE FROM insulinas WHERE usuario_id LIKE 'home-%'");
    await db.query("DELETE FROM glicemias WHERE usuario_id LIKE 'home-%'");
    await db.query("DELETE FROM usuarios WHERE id LIKE 'home-%'");

    // home-1 tem dados, home-2 é outro usuário com dados, home-vazio não tem nada
    await db.query(`
      INSERT INTO usuarios (id, nome, email, senha_hash) VALUES
        ('home-1', 'Maria', 'home1@teste.com', 'hash'),
        ('home-2', 'Joao', 'home2@teste.com', 'hash'),
        ('home-vazio', 'Sem Dados', 'homevazio@teste.com', 'hash')
    `);

    // a de 10 dias fica fora do gráfico; a de agora é a última de home-1
    await db.query(`
      INSERT INTO glicemias (id, usuario_id, valor, momento, data_hora) VALUES
        ('home-g1', 'home-1', 90,  'jejum', NOW() - INTERVAL 10 DAY),
        ('home-g2', 'home-1', 200, 'jejum', NOW() - INTERVAL 2 DAY),
        ('home-g3', 'home-1', 110, 'jejum', NOW()),
        ('home-g4', 'home-2', 300, 'jejum', NOW())
    `);

    // a última insulina de home-1 foi ontem, então não houve insulina hoje
    await db.query(`
      INSERT INTO insulinas (id, usuario_id, tipo, dose_ui, local_aplicacao, data_hora) VALUES
        ('home-i1', 'home-1', 'rapida', 8,  'abdomen', NOW() - INTERVAL 1 DAY),
        ('home-i2', 'home-1', 'basal',  20, 'coxa',    NOW() - INTERVAL 3 DAY),
        ('home-i3', 'home-2', 'mista',  12, 'braco',   NOW())
    `);

    // l1 é o próximo ativo; l2 é inativo (mais cedo), l3 já passou e l4 é de outro usuário
    await db.query(`
      INSERT INTO lembretes (id, usuario_id, titulo, data_hora, status) VALUES
        ('home-l1', 'home-1', 'Insulina da noite', NOW() + INTERVAL 5 HOUR, 'ativo'),
        ('home-l2', 'home-1', 'Desativado',        NOW() + INTERVAL 1 HOUR, 'inativo'),
        ('home-l3', 'home-1', 'Atrasado',          NOW() - INTERVAL 1 HOUR, 'ativo'),
        ('home-l4', 'home-2', 'Do outro usuario',  NOW() + INTERVAL 1 HOUR, 'ativo')
    `);
  });

  afterAll(async () => {
    await app.close();
    await db.destroy();
  });

  it('usuário sem dados retorna 200 com null e array vazio', async () => {
    const res = await resumo('home-vazio');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      nome: 'Sem Dados',
      ultimaGlicemia: null,
      ultimaInsulina: null,
      proximoLembrete: null,
      resumoDiario: { glicemiaRegistrada: false, insulinaRegistrada: false },
      glicemiaUltimos7Dias: [],
    });
  });

  it('usuário que não existe no banco também não gera 500', async () => {
    const res = await resumo('home-nao-existe');
    const body = res.body as ResumoBody;

    expect(res.status).toBe(200);
    expect(body.nome).toBeNull();
  });

  it('usuário com dados retorna a última glicemia e a última insulina', async () => {
    const res = await resumo('home-1');
    const body = res.body as ResumoBody;

    expect(res.status).toBe(200);
    expect(body.nome).toBe('Maria');
    expect(body.ultimaGlicemia?.id).toBe('home-g3');
    expect(body.ultimaGlicemia?.valor).toBe(110);
    expect(body.ultimaInsulina?.id).toBe('home-i1');
    expect(body.ultimaInsulina?.doseUi).toBe(8);
  });

  it('próximo lembrete considera só os ativos que ainda não passaram', async () => {
    const res = await resumo('home-1');
    const body = res.body as ResumoBody;

    // ignora o inativo (l2, que seria mais cedo) e o atrasado (l3)
    expect(body.proximoLembrete?.id).toBe('home-l1');
    expect(body.proximoLembrete?.titulo).toBe('Insulina da noite');
  });

  it('resumo diário e gráfico dos últimos 7 dias', async () => {
    const res = await resumo('home-1');
    const body = res.body as ResumoBody;

    // glicemia hoje, insulina não. Só os dois campos: sem alimentação nem exercício
    expect(body.resumoDiario).toEqual({
      glicemiaRegistrada: true,
      insulinaRegistrada: false,
    });
    const texto = JSON.stringify(body).toLowerCase();
    expect(texto).not.toContain('aliment');
    expect(texto).not.toContain('exerc');

    // do mais antigo para o mais novo, e a de 10 dias fica fora
    const valores = body.glicemiaUltimos7Dias.map((p) => p.valor);
    expect(valores).toEqual([200, 110]);
  });

  it('retorna somente dados do próprio usuário', async () => {
    const res = await resumo('home-2');
    const body = res.body as ResumoBody;

    expect(body.ultimaGlicemia?.valor).toBe(300);
    expect(body.ultimaInsulina?.id).toBe('home-i3');
    expect(body.proximoLembrete?.id).toBe('home-l4');
    expect(body.glicemiaUltimos7Dias).toHaveLength(1);
  });

  it('sem token retorna 401', async () => {
    const res = await request(servidor()).get('/home/summary');

    expect(res.status).toBe(401);
  });
});
