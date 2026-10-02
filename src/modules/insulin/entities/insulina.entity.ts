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
import { LocalAplicacao } from '../enums/local-aplicacao.enum';

@Entity('insulinas')
export class Insulina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_hora', type: 'datetime' })
  dataHora: Date;

  // A lista de tipos de insulina ainda não foi fechada pela equipe;
  // fica como texto até existir um conjunto aprovado.
  @Column({ type: 'varchar', length: 50 })
  tipo: string;

  @Column({ name: 'dose_ui', type: 'decimal', precision: 6, scale: 2 })
  doseUi: number;

  @Column({
    name: 'local_aplicacao',
    type: 'simple-enum',
    enum: LocalAplicacao,
    nullable: true,
  })
  localAplicacao: LocalAplicacao;

  @Column({ type: 'text', nullable: true })
  observacao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.insulinas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}
