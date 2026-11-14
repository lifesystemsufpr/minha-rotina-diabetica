import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// O contato de emergência saiu do produto (nov/2026): só tinha entrado por
// constar no DCU e não tem uso no app. Apagar as colunas também apaga os
// dados pessoais de terceiros que estavam guardados (LGPD: minimização).
//
// ATENÇÃO: o `down` recria as colunas vazias. Os dados apagados no `up` NÃO
// voltam. Faça backup antes de rodar em um banco com dados reais.
export class RemoveContatoEmergencia1794614400000 implements MigrationInterface {
  name = 'RemoveContatoEmergencia1794614400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('perfis', [
      'contato_emergencia_nome',
      'contato_emergencia_relacao',
      'contato_emergencia_telefone',
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('perfis', [
      new TableColumn({
        name: 'contato_emergencia_nome',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'contato_emergencia_relacao',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'contato_emergencia_telefone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    ]);
  }
}
