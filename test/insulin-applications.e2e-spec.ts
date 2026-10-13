import 'dotenv/config';
import { ExecutionContext, INestApplication, UnauthorizedException, ValidationPipe} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { InsulinController } from '../src/modules/insulin/insulin.controller';
import { InsulinService } from '../src/modules/insulin/insulin.service';


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

    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }

    req.user = {
      id: req.headers['x-user'] || USUARIO_ID
    };

    return true;
  },
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


 //---------------------------------------LISTAR-----------------------------------------------

  describe('GET /insulin-applications', () => {
    const listar = (usuario: string, filtros = '') =>

      request(app.getHttpServer())
        .get(`/insulin-applications${filtros}`)
        .set('Authorization', 'Bearer token')
        .set('x-user', usuario);

    const ids = (res: { body: { id: string }[] }) => res.body.map((i) => i.id);

    beforeAll(async () => {
      await db.query("DELETE FROM insulinas WHERE usuario_id LIKE 'lista-%'");

      // lista-1 tem 3 aplicações, lista-2 tem 1
      const dados = [
        ['lista-a', 'lista-1', 'rapida', '2026-10-10 08:00:00'],
        ['lista-b', 'lista-1', 'basal', '2026-10-12 08:00:00'],
        ['lista-c', 'lista-1', 'rapida', '2026-10-11 08:00:00'],
        ['lista-d', 'lista-2', 'rapida', '2026-10-11 09:00:00'],
      ];

      for (const linha of dados) {
        await db.query(
          `INSERT INTO insulinas (id, usuario_id, tipo, dose_ui, local_aplicacao, data_hora)
           VALUES (?, ?, ?, 10, 'abdomen', ?)`,
          linha,
        );
      }
    });

    it('retorna 200 em ordem decrescente de data', async () => {

      const res = await listar('lista-1');
      expect(res.status).toBe(200);
      expect(ids(res)).toEqual(['lista-b', 'lista-c', 'lista-a']);
    });

    it('retorna somente dados do próprio usuário', async () => {
      expect(ids(await listar('lista-2'))).toEqual(['lista-d']);
    });

    it('retorna 200 e array vazio sem dados', async () => {
      const res = await listar('lista-sem-dados');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('filtra por tipo, startDate e endDate', async () => {
      expect(ids(await listar('lista-1', '?tipo=basal'))).toEqual(['lista-b']);

      const datas = '?startDate=2026-10-11T00:00:00&endDate=2026-10-11T23:59:59';
      expect(ids(await listar('lista-1', datas))).toEqual(['lista-c']);
    });

    it('retorna 400 para filtro inválido', async () => {
      expect((await listar('lista-1', '?tipo=ultrarapida')).status).toBe(400);
    });

    it('retorna 401 sem token', async () => {
      const res = await request(app.getHttpServer()).get('/insulin-applications');
      expect(res.status).toBe(401);
    });

    });


 //---------------------------------------------------------------------------------------------

 //----------------------- ID-----------------------------------
 describe('Operações por ID', () =>{
  const idProprio = 'id-proprio';
  const idOutro = 'id-outro';
  const idInexistente = 'id-inexistente';

  const requisicao = ( metodo: 'get' | 'patch' | 'delete', id: string, usuario = USUARIO_ID) =>

    request(app.getHttpServer())
      [metodo](`/insulin-applications/${id}`)
      .set('Authorization', 'Bearer token')
      .set('x-user', usuario);

  beforeAll(async () => {
    await db.query(
      `INSERT INTO insulinas (id, usuario_id, tipo, dose_ui, local_aplicacao, data_hora)
       VALUES (?, ?, 'rapida', 20, 'abdomen', NOW()), (?, ?, 'rapida', 20, 'abdomen', NOW())`, [idProprio, USUARIO_ID, idOutro, 'usuario-2'],);
  });

  afterAll(async () => {
    await db.query( 'DELETE FROM insulinas WHERE id IN (?, ?)',[idProprio, idOutro], );
  });

//-----------------------------------CONSULTA-----------------------------------------

  it('consulta aplicação do próprio usuário', async () =>{
    const resposta = await requisicao('get', idProprio).expect(200);
    expect(resposta.body.id).toBe(idProprio);
  });

  it.each([idOutro, idInexistente])(
    'retorna 404 ao consultar: %s', (id) => requisicao('get', id).expect(404),
  );

// ---------------------------------EDICAO----------------------------------------

  it('edita aplicação:', async () => {
    await requisicao('patch', idProprio)
      .send({ doseUi: 15 })
      .expect(200);

    const resultado = await db.query('SELECT dose_ui FROM insulinas WHERE id = ?',  [idProprio]);

    expect(Number(resultado[0].dose_ui)).toBe(15);
  });

  it.each([
    { doseUi: 0 },
    { userId: 'outro-usuario' },
    {}])('rejeita dados inválidos ou vazios: %j', (dados: object) => requisicao('patch', idProprio).send(dados).expect(400), );

  it('não edita aplicação de outro usuário', async ()=>{

    await requisicao('patch', idOutro)
      .send({ doseUi: 99 })
      .expect(404);
  });

//------------------------------------------------------EXCLUSAO-----------------------------------------
  it('exclui aplicação', async () => {
    await requisicao('delete', idProprio).expect(200);

    const resultado = await db.query( 'SELECT id FROM insulinas WHERE id = ?',[idProprio]);

    expect(resultado).toHaveLength(0);
  });

  it.each([idOutro, idInexistente])(
    'retorna 404 ao excluir: %s',(id) => requisicao('delete', id).expect(404));

//---------------------------AUTORIZACAO--------------------------------------------------

  it.each(['get', 'patch', 'delete'] as const)('exige token na rota %s',(metodo) =>
      request(app.getHttpServer()) [metodo](`/insulin-applications/${idOutro}`) .expect(401) );
  });

});