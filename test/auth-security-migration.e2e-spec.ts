import { DataSource, QueryRunner, Table } from 'typeorm';
import { AddAuthSecurity1793664000000 } from '../src/database/migrations/1793664000000-AddAuthSecurity';

describe('Migration de segurança (SQLite isolado)', () => {
  let source: DataSource;
  let runner: QueryRunner;
  beforeAll(async () => {
    source = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
    }).initialize();
    runner = source.createQueryRunner();
    await runner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'senha_hash', type: 'varchar' },
        ],
      }),
    );
    await runner.query('INSERT INTO usuarios (id, senha_hash) VALUES (?, ?)', [
      'synthetic-user',
      'synthetic-hash',
    ]);
  });
  afterAll(async () => {
    await runner.release();
    await source.destroy();
  });
  it('adiciona versão com padrão zero e tabela indexada sem alterar a senha existente', async () => {
    await new AddAuthSecurity1793664000000().up(runner);
    const rows = (await runner.query('SELECT * FROM usuarios')) as Record<
      string,
      unknown
    >[];
    expect(rows).toEqual([
      { id: 'synthetic-user', senha_hash: 'synthetic-hash', token_version: 0 },
    ]);
    const table = await runner.getTable('auth_rate_buckets');
    expect(
      table?.indices.some((index) => index.columnNames.includes('expires_at')),
    ).toBe(true);
  });
  it('down remove apenas as estruturas da entrega no banco descartável de teste', async () => {
    await new AddAuthSecurity1793664000000().down(runner);
    expect(await runner.hasTable('auth_rate_buckets')).toBe(false);
    expect(await runner.hasColumn('usuarios', 'token_version')).toBe(false);
    const rows = (await runner.query('SELECT * FROM usuarios')) as Record<
      string,
      unknown
    >[];
    expect(rows).toEqual([
      { id: 'synthetic-user', senha_hash: 'synthetic-hash' },
    ]);
  });
});
