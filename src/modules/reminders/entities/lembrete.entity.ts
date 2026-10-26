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
import { StatusLembrete } from '../enums/status-lembrete.enum';

@Entity('lembretes')
export class Lembrete {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ name: 'data_hora', type: 'datetime' })
  dataHora: Date;

  @Column({
    type: 'simple-enum',
    enum: StatusLembrete,
    default: StatusLembrete.ATIVO,
  })
  status: StatusLembrete;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.lembretes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}
