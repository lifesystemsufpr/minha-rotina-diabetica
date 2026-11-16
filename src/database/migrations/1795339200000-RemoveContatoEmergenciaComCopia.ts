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

    const existentes: string[] = [];
    for (const c of COLUNAS) {
      if (await queryRunner.hasColumn('perfis', c.coluna)) {
        existentes.push(c.coluna);
      }
    }

    // A cópia vem antes de apagar qualquer coluna. Se faltar alguma, a cópia
    // já foi feita numa execução anterior que parou no meio.
    if (existentes.length === COLUNAS.length) {
      // NOT EXISTS: numa nova tentativa, mantém o que já foi copiado.
      await queryRunner.query(
        `INSERT INTO ${BACKUP} (usuario_id, nome, relacao, telefone)
         SELECT p.usuario_id, p.contato_emergencia_nome, p.contato_emergencia_relacao, p.contato_emergencia_telefone
         FROM perfis p
         WHERE (p.contato_emergencia_nome IS NOT NULL
             OR p.contato_emergencia_relacao IS NOT NULL
             OR p.contato_emergencia_telefone IS NOT NULL)
           AND NOT EXISTS (SELECT 1 FROM ${BACKUP} b WHERE b.usuario_id = p.usuario_id)`,
      );
    }

    // Uma coluna por vez: no MySQL cada DROP é confirmado na hora, então uma
    // nova tentativa apaga só as que sobraram.
    for (const coluna of existentes) {
      await queryRunner.dropColumn('perfis', coluna);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const c of COLUNAS) {
      if (!(await queryRunner.hasColumn('perfis', c.coluna))) {
        await queryRunner.addColumn(
          'perfis',
          new TableColumn({
            name: c.coluna,
            type: 'varchar',
            length: c.length,
            isNullable: true,
          }),
        );
      }
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
