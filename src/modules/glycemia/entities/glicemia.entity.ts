import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('glicemias')
export class Glicemia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_hora', type: 'datetime' })
  dataHora: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  valor: number;

  @Column({ type: 'varchar', length: 50 })
  momento: string; 

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.glicemias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}