import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MomentoGlicemia } from '../enums/momento-glicemia.enum';
import { StatusGlicemia } from '../enums/status-glicemia.enum';

@Entity('glicemias')
export class Glicemia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_hora', type: 'datetime' })
  dataHora: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  valor: number;

  @Column({ type: 'simple-enum', enum: MomentoGlicemia })
  momento: MomentoGlicemia;

  @Column({ type: 'simple-enum', enum: StatusGlicemia, nullable: true })
  status: StatusGlicemia;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.glicemias, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}
