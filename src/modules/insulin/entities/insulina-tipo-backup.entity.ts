import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// Cópia do `tipo` original de `insulinas` feita pela migration que fechou a
// lista de tipos. Serve para reverter a migration sem perda. A exclusão de
// conta apaga as linhas das insulinas da pessoa (LGPD).
@Entity('insulinas_tipo_backup')
export class InsulinaTipoBackup {
  @PrimaryColumn({ name: 'insulina_id', type: 'varchar', length: 36 })
  insulinaId!: string;

  @Column({ name: 'tipo_original', type: 'varchar', length: 50 })
  tipoOriginal!: string;

  @CreateDateColumn({ name: 'copiado_em' })
  copiadoEm!: Date;
}
