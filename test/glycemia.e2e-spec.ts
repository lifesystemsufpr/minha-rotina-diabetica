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

const fakeGuard ={
  canActivate: (context: ExecutionContext) =>{
    const req = context.switchToHttp().getRequest();

    if (!req.headers.authorization){
      throw new UnauthorizedException();
    }

    req.user ={
      id: req.headers['x-user'] || USUARIO_ID,
    };

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
      database: process.env.DATABASE_NAME
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

//----------------------------------listar----------------------------------------------

  describe('GET /glycemias', () => {
  const listar = (usuario: string, filtros = '') =>

    request(app.getHttpServer())
      .get(`/glycemias${filtros}`)
      .set('Authorization', 'Bearer token')
      .set('x-user', usuario);

  const ids = (res: { body: { id: string }[] }) =>
    res.body.map((i) => i.id);

  beforeAll(async () => {
    await db.query("DELETE FROM glicemias WHERE usuario_id LIKE 'lista-%'");

    const dados = [
      ['lista-a', 'lista-1', 100, 'jejum', '2026-10-10 08:00:00'],
      ['lista-b', 'lista-1', 150, 'antes_refeicao', '2026-10-12 08:00:00'],
      ['lista-c', 'lista-1', 110, 'jejum', '2026-10-11 08:00:00'],
      ['lista-d', 'lista-2', 90, 'jejum', '2026-10-11 09:00:00']
    ];

    for (const linha of dados) {
      await db.query( `INSERT INTO glicemias (id, usuario_id, valor, momento, status, data_hora) VALUES (?, ?, ?, ?, 'normal', ?)`,linha );
    }
  });

  it('retorna 200 em ordem decrescente de data', async() =>{
    const res = await listar('lista-1');

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual(['lista-b', 'lista-c', 'lista-a']);
  });

  it('retorna somente dados do próprio usuário', async() =>{
    expect(ids(await listar('lista-2'))).toEqual(['lista-d']);
  });

  it('retorna 200 e lista vazia sem dados', async() =>{
    const res = await listar('lista-sem-dados');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('filtra por momento, startDate e endDate', async() =>{
    expect(ids(await listar('lista-1', '?momento=antes_refeicao')))
      .toEqual(['lista-b']);

    
const datas = '?startDate=11-10-2026&endDate=11-10-2026';


    expect(ids(await listar('lista-1', datas))).toEqual(['lista-c']);
  });

  it('retorna 400 para filtro inválido', async () => {
    expect((await listar('lista-1', '?momento=madrugada')).status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app.getHttpServer()).get('/glycemias');

    expect(res.status).toBe(401);
  });
});

//--------------------------------------------------------------------------------------
    const buscar = (usuario: string, id: string) =>
    request(app.getHttpServer())
        .get(`/glycemias/${id}`)
        .set('Authorization', 'Bearer token')
        .set('x-user', usuario);

    
    it('consulta glicemia do usuário', async() =>{
    const res = await buscar('lista-1', 'lista-a');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('lista-a');
    });

    it(' 404 para ID inexistente', async() =>{
    const res = await buscar('lista-1', 'id-inexistente');

    expect(res.status).toBe(404);
    });

    it('retorna 404 para glicemia de outro usuário', async() =>{
    const res = await buscar('lista-1', 'lista-d');

    expect(res.status).toBe(404);
    });

//-----------------------------------------------------------------


describe('PATCH /glycemias/:id', () =>{

  const idProprio = 'glicemia-patch-proprio';
  const idOutro = 'glicemia-patch-outro';
  const idInexistente = 'glicemia-patch-inexistente';

  const editar = (id: string, usuario = USUARIO_ID) =>
    request(app.getHttpServer())
      .patch(`/glycemias/${id}`)
      .set('Authorization', 'Bearer token')
      .set('x-user', usuario);

  beforeAll(async() =>{

    await db.query( 'DELETE FROM glicemias WHERE id IN (?, ?)',[idProprio, idOutro]);

    await db.query(`INSERT INTO glicemias(id, usuario_id, valor, momento, status, data_hora) VALUES (?, ?, 100, 'jejum', 'normal', '2026-10-12 08:00:00'),   (?, ?, 100, 'jejum', 'normal', '2026-10-12 09:00:00')`, [idProprio, USUARIO_ID, idOutro, 'usuario-2']);
  });

  afterAll(async() =>{
    await db.query('DELETE FROM glicemias WHERE id IN (?, ?)',[idProprio, idOutro]);
  });

  it('edita glicemia', async() =>{
    const res = await editar(idProprio)
      .send({ valor: 150 })
      .expect(200);

    expect(Number(res.body.valor)).toBe(150);
  });

  it('atualiza o valor no banco', async() =>{
    await editar(idProprio)
      .send({ valor: 160 })
      .expect(200);

    const resultado = await db.query( 'SELECT valor FROM glicemias WHERE id = ?', [idProprio]);

    expect(Number(resultado[0].valor)).toBe(160);
  });

  it.each([
    {}])('rejeita dados inválidos ou vazios: %j', (dados: object) => editar(idProprio).send(dados).expect(400),);

  it('não edita glicemia de outro usuário', async() =>{
    await editar(idOutro)
      .send({ valor: 99 })
      .expect(404);

    const resultado = await db.query( 'SELECT valor FROM glicemias WHERE id = ?',[idOutro]);

    expect(Number(resultado[0].valor)).toBe(100);
  });

  it('retorna 404 para ID inexistente', async() =>{
    await editar(idInexistente)
      .send({ valor: 150 })
      .expect(404);
  });

  it('exige token para editar', async ()=>{
    await request(app.getHttpServer())
      .patch(`/glycemias/${idProprio}`)
      .send({ valor: 150 })
      .expect(401);
  });

//-------------------------------------------------------------------------------------------------------------
    
        describe('DELETE /glycemias/:id', () =>{
        const idProprio = 'glicemia-delete-proprio';
        const idOutro = 'glicemia-delete-outro';
        const idInexistente = 'glicemia-delete-inexistente';

        const excluir = (id: string, usuario = USUARIO_ID) =>
            request(app.getHttpServer())
            .delete(`/glycemias/${id}`)
            .set('Authorization', 'Bearer token')
            .set('x-user', usuario);

        beforeAll(async() =>{
            await db.query('DELETE FROM glicemias WHERE id IN (?, ?)', [idProprio, idOutro]);

            await db.query(`INSERT INTO glicemias (id, usuario_id, valor, momento, status, data_hora) VALUES (?, ?, 100, 'jejum', 'normal', NOW()), (?, ?, 100, 'jejum', 'normal', NOW())`, [idProprio, USUARIO_ID, idOutro, 'usuario-2']);
        });

        afterAll(async() =>{
            await db.query( 'DELETE FROM glicemias WHERE id IN (?, ?)',  [idProprio, idOutro]);
        });

        it('exclui glicemia', async() =>{
            await excluir(idProprio).expect(204);

            const resultado = await db.query( 'SELECT id FROM glicemias WHERE id = ?', [idProprio]);
            expect(resultado).toHaveLength(0);
        });

        it('não exclui glicemia do outro', async() =>{
            await excluir(idOutro).expect(404);

            const resultado = await db.query('SELECT id FROM glicemias WHERE id = ?',  [idOutro]);
            expect(resultado).toHaveLength(1);
        });

        it(' 404 para ID inexistente', async() =>{
            await excluir(idInexistente).expect(404);
        });

        it('exige token', async () => {
            await request(app.getHttpServer())
            .delete(`/glycemias/${idOutro}`)
            .expect(401);
        });
    });
});

});
