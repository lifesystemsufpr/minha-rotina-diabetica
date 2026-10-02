import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TipoDiabetes } from '../enums/tipo-diabetes.enum';

@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: string;

  @Column({
    name: 'tipo_diabetes',
    type: 'simple-enum',
    enum: TipoDiabetes,
    nullable: true,
  })
  tipoDiabetes: TipoDiabetes;

  @Column({
    name: 'altura_cm',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  alturaCm: number;

  @Column({
    name: 'peso_kg',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  pesoKg: number;

  @Column({
    name: 'contato_emergencia_nome',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  contatoEmergenciaNome: string;

  @Column({
    name: 'contato_emergencia_relacao',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  contatoEmergenciaRelacao: string;

  @Column({
    name: 'contato_emergencia_telefone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contatoEmergenciaTelefone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.perfil, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}
