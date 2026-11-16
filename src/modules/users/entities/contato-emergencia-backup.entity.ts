import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// Cópia dos contatos de emergência feita pela migration que tirou as colunas
// de `perfis` (RemoveContatoEmergenciaComCopia). Serve só para voltar atrás:
// a API não lê nem devolve esses dados. A exclusão de conta apaga a linha da
// pessoa (LGPD). Quando a remoção estiver confirmada, a tabela inteira pode
// ser apagada (docs/deploy-backup.md).
@Entity('perfis_contato_emergencia_backup')
export class ContatoEmergenciaBackup {
  @PrimaryColumn({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relacao!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone!: string | null;

  @CreateDateColumn({ name: 'copiado_em' })
  copiadoEm!: Date;
}
