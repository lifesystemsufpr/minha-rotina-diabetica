import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('lembretes')
export class Lembrete {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 150 })  titulo: string;

  @Column({ name: 'data_hora', type: 'datetime' }) dataHora: Date;

  @Column({ type: 'varchar', length: 20, default: 'ativo' }) status: string;

  @CreateDateColumn({ name: 'created_at' }) created_At: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updated_At: Date;

  @ManyToOne(() => User, (user) => user.lembretes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' }) user: User;
}