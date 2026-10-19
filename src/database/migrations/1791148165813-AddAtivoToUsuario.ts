import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAtivoToUsuario1791148165813 implements MigrationInterface {
  name = 'AddAtivoToUsuario1791148165813';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`ativo\` tinyint NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`ativo\``);
  }
}
