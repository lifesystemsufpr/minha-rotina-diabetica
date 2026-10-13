import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Token de recuperação de senha. O token em texto puro NUNCA é gravado:
// só o hash SHA-256 (se o banco vazar, os tokens não podem ser usados).
@Entity('tokens_recuperacao_senha')
@Index('IDX_tokens_recuperacao_senha_token_hash', ['tokenHash'], {
  unique: true,
})
@Index('IDX_tokens_recuperacao_senha_usuario_id', ['usuarioId'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  // Preenchido quando o token é consumido (ou invalidado por um mais novo).
  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'usuario_id',
    foreignKeyConstraintName: 'FK_tokens_recuperacao_senha_usuario_id',
  })
  user: User;
}