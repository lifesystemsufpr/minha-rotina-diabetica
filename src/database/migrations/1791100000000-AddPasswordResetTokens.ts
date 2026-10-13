import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokens1791100000000 implements MigrationInterface {
  name = 'AddPasswordResetTokens1791100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`tokens_recuperacao_senha\` (\`id\` varchar(36) NOT NULL, \`token_hash\` varchar(64) NOT NULL, \`expires_at\` datetime NOT NULL, \`used_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuario_id\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_tokens_recuperacao_senha_token_hash\` (\`token_hash\`), INDEX \`IDX_tokens_recuperacao_senha_usuario_id\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tokens_recuperacao_senha\` ADD CONSTRAINT \`FK_tokens_recuperacao_senha_usuario_id\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tokens_recuperacao_senha\` DROP FOREIGN KEY \`FK_tokens_recuperacao_senha_usuario_id\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_tokens_recuperacao_senha_usuario_id\` ON \`tokens_recuperacao_senha\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_tokens_recuperacao_senha_token_hash\` ON \`tokens_recuperacao_senha\``,
    );
    await queryRunner.query(`DROP TABLE \`tokens_recuperacao_senha\``);
  }
}