import 'dotenv/config';
import {ExecutionContext,INestApplication,UnauthorizedException,ValidationPipe,} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { GlycemiaController } from '../src/modules/glycemia/glycemia.controller';
import { GlycemiaService } from '../src/modules/glycemia/glycemia.service';


jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class {},
}));

jest.setTimeout(30000);

const USUARIO_ID = 'usuario-1';


const fakeGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    if (!req.headers.authorization) throw new UnauthorizedException();
    req.user = { id: USUARIO_ID };
    return true;
  },
};

const body = {
  valor: 110,
  momento: 'jejum',
  data: '14-04-2026',
  hora: '08:30',
  observacao: '',
};

describe('POST /glycemias', () =>{
  let app: INestApplication;
  let db: DataSource;

  const enviar = (corpo: object) =>
    request(app.getHttpServer())
      .post('/glycemias')
      .set('Authorization', 'Bearer token')
      .send(corpo);

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
      controllers: [GlycemiaController],
      providers: [GlycemiaService, { provide: DataSource, useValue: db }]})

      .overrideGuard(JwtAuthGuard)
      .useValue(fakeGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () =>{
    await app.close();
    await db.destroy();
  });

  it('Insere dados no banco', async () => {
    await db.query("DELETE FROM glicemias WHERE id = 'glicemia-teste-1'");
    await db.query(`INSERT INTO glicemias (id, usuario_id, valor, momento, status, data_hora) VALUES ('glicemia-teste-1', ?, 95, 'jejum', 'normal', '2026-10-12 07:00:00')`,[USUARIO_ID]);

    const linhas = await db.query("SELECT status FROM glicemias WHERE id = 'glicemia-teste-1'");
    expect(linhas[0].status).toBe('normal');
  });

  it('registro válido 201 ', async () => {
    const res = await enviar(body);
    console.log(res.body);
    expect(res.status).toBe(201);

    const linhas = await db.query('SELECT usuario_id FROM glicemias WHERE id = ?', [res.body.id]);
    expect(linhas[0].usuario_id).toBe(USUARIO_ID);
  });

  it('Define o status da glicemia', async () => {
    expect((await enviar({ ...body, valor: 50 })).body.status).toBe('baixa');
    expect((await enviar({ ...body, valor: 110 })).body.status).toBe('normal');
    expect((await enviar({ ...body, valor: 250 })).body.status).toBe('alta');
  });


    it('dados inválidos retornam 400', async () => {
    const invalidos = [
        { valor: 0 },
        { momento: 'madrugada' },
        { data: '12/10/2026' },
        { hora: '25:90' },
    ];

    for (const invalido of invalidos) {
        const res = await enviar({ ...body, ...invalido });
        console.log(invalido, res.status);
        expect(res.status).toBe(400);
    }
    });


  it('Dados inválidos 400', async () =>{
    expect((await enviar({ ...body, usuarioId: 'outro' })).status).toBe(400);
    expect((await enviar({ ...body, status: 'normal' })).status).toBe(400);
  });

  it('sem token retorna 401', async () =>{
    const res = await request(app.getHttpServer()).post('/glycemias').send(body);
    expect(res.status).toBe(401);
  });
});