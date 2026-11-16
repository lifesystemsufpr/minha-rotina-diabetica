import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

const COLUNAS = [
  { coluna: 'contato_emergencia_nome', copia: 'nome', length: '100' },
  { coluna: 'contato_emergencia_relacao', copia: 'relacao', length: '50' },
  { coluna: 'contato_emergencia_telefone', copia: 'telefone', length: '20' },
];
const BACKUP = 'perfis_contato_emergencia_backup';

// Tira o contato de emergência de `perfis` sem perder os dados: antes de
// apagar as colunas, copia os contatos preenchidos para uma tabela de backup.
// O down devolve os contatos. Bancos onde as colunas já tinham sido apagadas
// (pela migration antiga RemoveContatoEmergencia) só ganham a tabela vazia.
export class RemoveContatoEmergenciaComCopia1795339200000 implements MigrationInterface {
  name = 'RemoveContatoEmergenciaComCopia1795339200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable(BACKUP))) {
      await queryRunner.createTable(
        new Table({
          name: BACKUP,
          columns: [
            {
              name: 'usuario_id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            ...COLUNAS.map((c) => ({
              name: c.copia,
              type: 'varchar',
              length: c.length,
              isNullable: true,
            })),
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

    if (!(await queryRunner.hasColumn('perfis', COLUNAS[0].coluna))) return;

    await queryRunner.query(
      `INSERT INTO ${BACKUP} (usuario_id, nome, relacao, telefone)
       SELECT usuario_id, contato_emergencia_nome, contato_emergencia_relacao, contato_emergencia_telefone
       FROM perfis
       WHERE contato_emergencia_nome IS NOT NULL
          OR contato_emergencia_relacao IS NOT NULL
          OR contato_emergencia_telefone IS NOT NULL`,
    );
    await queryRunner.dropColumns(
      'perfis',
      COLUNAS.map((c) => c.coluna),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('perfis', COLUNAS[0].coluna))) {
      await queryRunner.addColumns(
        'perfis',
        COLUNAS.map(
          (c) =>
            new TableColumn({
              name: c.coluna,
              type: 'varchar',
              length: c.length,
              isNullable: true,
            }),
        ),
      );
    }
    if (await queryRunner.hasTable(BACKUP)) {
      for (const c of COLUNAS) {
        await queryRunner.query(
          `UPDATE perfis
           SET ${c.coluna} = (SELECT b.${c.copia} FROM ${BACKUP} b WHERE b.usuario_id = perfis.usuario_id)
           WHERE usuario_id IN (SELECT usuario_id FROM ${BACKUP})`,
        );
      }
      await queryRunner.dropTable(BACKUP);
    }
  }
}
