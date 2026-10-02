import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790951209403 implements MigrationInterface {
  name = 'InitialSchema1790951209403';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`perfis\` (\`id\` varchar(36) NOT NULL, \`data_nascimento\` date NULL, \`tipo_diabetes\` enum ('TIPO_1', 'TIPO_2', 'OUTRO') NULL, \`altura_cm\` decimal(5,2) NULL, \`peso_kg\` decimal(5,2) NULL, \`contato_emergencia_nome\` varchar(100) NULL, \`contato_emergencia_relacao\` varchar(50) NULL, \`contato_emergencia_telefone\` varchar(20) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`usuario_id\` varchar(36) NOT NULL, UNIQUE INDEX \`REL_a013fc99e8db866740ab733dd1\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`glicemias\` (\`id\` varchar(36) NOT NULL, \`data_hora\` datetime NOT NULL, \`valor\` decimal(5,2) NOT NULL, \`momento\` enum ('JEJUM', 'ANTES_CAFE', 'APOS_CAFE', 'ANTES_ALMOCO', 'APOS_ALMOCO', 'ANTES_JANTAR', 'APOS_JANTAR') NOT NULL, \`status\` enum ('NORMAL', 'ALTA', 'BAIXA') NULL, \`observacao\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`usuario_id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`insulinas\` (\`id\` varchar(36) NOT NULL, \`data_hora\` datetime NOT NULL, \`tipo\` varchar(50) NOT NULL, \`dose_ui\` decimal(6,2) NOT NULL, \`local_aplicacao\` enum ('ABDOMEN', 'BRACO', 'COXA', 'GLUTEO') NULL, \`observacao\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`usuario_id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`lembretes\` (\`id\` varchar(36) NOT NULL, \`titulo\` varchar(150) NOT NULL, \`data_hora\` datetime NOT NULL, \`status\` enum ('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`usuario_id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuarios\` (\`id\` varchar(36) NOT NULL, \`nome\` varchar(100) NOT NULL, \`email\` varchar(100) NOT NULL, \`senha_hash\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfis\` ADD CONSTRAINT \`FK_a013fc99e8db866740ab733dd1f\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`glicemias\` ADD CONSTRAINT \`FK_3103a3dac1c280543bad584a0e9\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`insulinas\` ADD CONSTRAINT \`FK_c772f3d6e18e89ec49df5498d22\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lembretes\` ADD CONSTRAINT \`FK_3bb685c185fc8236662ba1f2af1\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`lembretes\` DROP FOREIGN KEY \`FK_3bb685c185fc8236662ba1f2af1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`insulinas\` DROP FOREIGN KEY \`FK_c772f3d6e18e89ec49df5498d22\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`glicemias\` DROP FOREIGN KEY \`FK_3103a3dac1c280543bad584a0e9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfis\` DROP FOREIGN KEY \`FK_a013fc99e8db866740ab733dd1f\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``,
    );
    await queryRunner.query(`DROP TABLE \`usuarios\``);
    await queryRunner.query(`DROP TABLE \`lembretes\``);
    await queryRunner.query(`DROP TABLE \`insulinas\``);
    await queryRunner.query(`DROP TABLE \`glicemias\``);
    await queryRunner.query(
      `DROP INDEX \`REL_a013fc99e8db866740ab733dd1\` ON \`perfis\``,
    );
    await queryRunner.query(`DROP TABLE \`perfis\``);
  }
}
