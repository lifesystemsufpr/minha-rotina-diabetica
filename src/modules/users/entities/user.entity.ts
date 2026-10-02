import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Perfil } from './perfil.entity';
import { Glicemia } from '../../glycemia/entities/glicemia.entity';
import { Insulina } from '../../insulin/entities/insulina.entity';
import { Lembrete } from '../../reminders/entities/lembrete.entity';

// Usuario guarda apenas dados de autenticação; dados pessoais e clínicos
// ficam em Perfil (Diagrama de Classes e manual da Sprint 2).
@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255 })
  senhaHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Perfil, (perfil) => perfil.user)
  perfil: Perfil;

  @OneToMany(() => Glicemia, (glicemia) => glicemia.user)
  glicemias: Glicemia[];

  @OneToMany(() => Insulina, (insulina) => insulina.user)
  insulinas: Insulina[];

  @OneToMany(() => Lembrete, (lembrete) => lembrete.user)
  lembretes: Lembrete[];
}
