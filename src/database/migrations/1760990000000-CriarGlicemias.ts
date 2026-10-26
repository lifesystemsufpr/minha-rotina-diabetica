import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarGlicemias1760990000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE glicemias(
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        usuario_id VARCHAR(36) NOT NULL,
        data_hora DATETIME NOT NULL,
        valor DECIMAL(5,2) NOT NULL,
        momento VARCHAR(50) NOT NULL,
        status VARCHAR(20) NULL,
        observacao TEXT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS glicemias`);
  }
}
