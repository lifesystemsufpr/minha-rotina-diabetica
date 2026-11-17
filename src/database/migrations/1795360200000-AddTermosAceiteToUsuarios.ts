import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTermosAceiteToUsuarios1795360200000 implements MigrationInterface {
  name = 'AddTermosAceiteToUsuarios1795360200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('usuarios', 'termos_versao'))) {
      await queryRunner.addColumn(
        'usuarios',
        new TableColumn({
          name: 'termos_versao',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    }
    if (!(await queryRunner.hasColumn('usuarios', 'termos_aceitos_em'))) {
      await queryRunner.addColumn(
        'usuarios',
        new TableColumn({
          name: 'termos_aceitos_em',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('usuarios', 'termos_aceitos_em')) {
      await queryRunner.dropColumn('usuarios', 'termos_aceitos_em');
    }
    if (await queryRunner.hasColumn('usuarios', 'termos_versao')) {
      await queryRunner.dropColumn('usuarios', 'termos_versao');
    }
  }
}
