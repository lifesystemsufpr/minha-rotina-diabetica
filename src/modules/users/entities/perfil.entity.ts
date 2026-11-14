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
import { columnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'data_nascimento',
    type: 'date',
    nullable: true,
  })
  dataNascimento: string | null;

  @Column({
    name: 'tipo_diabetes',
    type: 'simple-enum',
    enum: TipoDiabetes,
    nullable: true,
  })
  tipoDiabetes: TipoDiabetes | null;

  @Column({
    name: 'altura_cm',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: columnNumericTransformer,
  })
  alturaCm: number | null;

  @Column({
    name: 'peso_kg',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: columnNumericTransformer,
  })
  pesoKg: number | null;

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
