import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddAuthSecurity1793664000000 implements MigrationInterface {
  name = 'AddAuthSecurity1793664000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'usuarios',
      new TableColumn({
        name: 'token_version',
        type: 'int',
        default: 0,
        isNullable: false,
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'auth_rate_buckets',
        columns: [
          { name: 'key', type: 'varchar', length: '64', isPrimary: true },
          { name: 'hits', type: 'int', default: 0 },
          { name: 'expires_at', type: 'datetime' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'auth_rate_buckets',
      new TableIndex({
        name: 'IDX_auth_rate_buckets_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_rate_buckets');
    await queryRunner.dropColumn('usuarios', 'token_version');
  }
}
