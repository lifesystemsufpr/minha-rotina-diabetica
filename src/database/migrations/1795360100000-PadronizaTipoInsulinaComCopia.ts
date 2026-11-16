import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const BACKUP = 'insulinas_tipo_backup';

// Fecha a lista de tipos de insulina sem perder o texto original:
// 1. Cria `insulinas_tipo_backup` e copia o `tipo` original de todas as linhas
//    de `insulinas` (idempotente com NOT EXISTS);
// 2. Converte os rótulos conhecidos do app antigo para os novos códigos;
//    textos sem correspondência continuam como estão;
// 3. O `down` restaura o `tipo` original a partir da cópia e apaga a tabela.
export class PadronizaTipoInsulinaComCopia1795360100000 implements MigrationInterface {
  name = 'PadronizaTipoInsulinaComCopia1795360100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable(BACKUP))) {
      await queryRunner.createTable(
        new Table({
          name: BACKUP,
          columns: [
            {
              name: 'insulina_id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'tipo_original',
              type: 'varchar',
              length: '50',
              isNullable: false,
            },
            {
              name: 'copiado_em',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
            },
          ],
        }),
      );
    }

    await queryRunner.query(
      `INSERT INTO ${BACKUP} (insulina_id, tipo_original)
       SELECT i.id, i.tipo
       FROM insulinas i
       WHERE NOT EXISTS (
         SELECT 1 FROM ${BACKUP} b WHERE b.insulina_id = i.id
       )`,
    );

    await queryRunner.query(
      `UPDATE insulinas
       SET tipo = CASE
         WHEN LOWER(TRIM(tipo)) = 'rápida' AND HEX(TRIM(tipo)) <> HEX('RAPIDA') THEN 'ULTRARRAPIDA'
         WHEN LOWER(TRIM(tipo)) = 'regular' THEN 'RAPIDA'
         WHEN LOWER(TRIM(tipo)) = 'nph' THEN 'INTERMEDIARIA'
         WHEN LOWER(TRIM(tipo)) = 'longa duração' THEN 'LONGA'
         ELSE tipo
       END`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable(BACKUP)) {
      await queryRunner.query(
        `UPDATE insulinas
         SET tipo = (
           SELECT b.tipo_original
           FROM ${BACKUP} b
           WHERE b.insulina_id = insulinas.id
         )
         WHERE id IN (SELECT insulina_id FROM ${BACKUP})`,
      );
      await queryRunner.dropTable(BACKUP);
    }
  }
}
