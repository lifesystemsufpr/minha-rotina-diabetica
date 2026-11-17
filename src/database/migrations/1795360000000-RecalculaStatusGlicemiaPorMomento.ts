import { MigrationInterface, QueryRunner } from 'typeorm';

// Recalcula o `status` de todas as glicemias gravadas com as metas por momento
// da Diretriz SBD Ed. 2026 (teto 130 mg/dL em jejum e antes das refeições;
// teto 180 mg/dL após as refeições).
// Reversível sem tabela de cópia porque o `status` antigo era função apenas do
// `valor` (< 70 BAIXA, 70 a 180 NORMAL, > 180 ALTA), e nem `valor` nem
// `momento` são alterados por esta migration.
export class RecalculaStatusGlicemiaPorMomento1795360000000 implements MigrationInterface {
  name = 'RecalculaStatusGlicemiaPorMomento1795360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE glicemias
       SET status = CASE
         WHEN valor < 70 THEN 'BAIXA'
         WHEN momento IN ('JEJUM', 'ANTES_CAFE', 'ANTES_ALMOCO', 'ANTES_JANTAR') AND valor > 130 THEN 'ALTA'
         WHEN valor > 180 THEN 'ALTA'
         ELSE 'NORMAL'
       END`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE glicemias
       SET status = CASE
         WHEN valor < 70 THEN 'BAIXA'
         WHEN valor > 180 THEN 'ALTA'
         ELSE 'NORMAL'
       END`,
    );
  }
}
