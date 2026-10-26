import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarInsulinas1761000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
        `CREATE TABLE insulinas (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        usuario_id VARCHAR(36) NOT NULL,
        data_hora DATETIME NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        dose_ui DECIMAL(6,2) NOT NULL,
        local_aplicacao VARCHAR(50) NOT NULL,
        observacao TEXT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE 
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS insulinas`);
  }
}