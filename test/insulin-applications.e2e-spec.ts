import 'dotenv/config';
import { ExecutionContext, INestApplication, UnauthorizedException, ValidationPipe} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { InsulinController } from '../src/modules/insulin/insulin.controller';
import { InsulinService } from '../src/modules/insulin/insulin.service';

// Evita o erro de ES Module: o Jest não carrega o @nestjs/passport.

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class {},
}));

jest.setTimeout(30000);

const USUARIO_ID = 'usuario-1';
const ID_TESTE = 'insulina-teste-1';

// Guard de mentira: sem Authorization dá 401, com Authorization define o usuário
const fakeGuard = {

  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    if (!req.headers.authorization) throw new UnauthorizedException();
    req.user = { id: USUARIO_ID };
    return true; },
};

const body = {
  tipo: 'rapida',
  doseUi: 10,
  localAplicacao: 'abdomen',
  dataHora: '2026-10-12T08:30:00.000Z',
  observacao: 'enviado pela API',
};

describe('POST /insulin-applications', () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    // conecta no MySQL usando o .env
    db = new DataSource({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });

    await db.initialize();

    // o app.init() chama o onModuleInit do service, que cria a tabela insulinas
    const moduleRef = await Test.createTestingModule({
      controllers: [InsulinController],
      providers: [InsulinService, { provide: DataSource, useValue: db }],
    })

      .overrideGuard(JwtAuthGuard)
      .useValue(fakeGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    });

  afterAll(async () => {
    await app.close();
    await db.destroy();
    });

  it('INSERT direto na tabela insulinas funciona', async () => {
    await db.query('DELETE FROM insulinas WHERE id = ?', [ID_TESTE]);
    
    await db.query( `INSERT INTO insulinas (id, usuario_id, tipo, dose_ui, local_aplicacao, data_hora, observacao) VALUES (?, ?, 'basal', 20, 'coxa', '2026-10-12 07:00:00', 'inserido pelo teste')`, [ID_TESTE, USUARIO_ID]);

    const linhas = await db.query('SELECT tipo FROM insulinas WHERE id = ?', [ID_TESTE]);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].tipo).toBe('basal');
  });

  it('registro válido retorna 201 e grava no banco', async () => {

    const res = await request(app.getHttpServer())
      .post('/insulin-applications')
      .set('Authorization', 'Bearer token')
      .send(body);

    expect(res.status).toBe(201);

//-------------------------------------------------------------------------------

    // confere no MySQL que a linha existe e é do usuário do token
    const linhas = await db.query(
      'SELECT usuario_id FROM insulinas WHERE id = ?',
      [res.body.id],
    );

    expect(linhas).toHaveLength(1);
    expect(linhas[0].usuario_id).toBe(USUARIO_ID);
  });

  it('dose inválida retorna 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/insulin-applications')
      .set('Authorization', 'Bearer token')
      .send({ ...body, doseUi: 0 });

    expect(res.status).toBe(400);
  });

  it('sem token retorna 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/insulin-applications')
      .send(body);

    expect(res.status).toBe(401);
  });
});