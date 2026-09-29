import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Perfil } from './perfil.entity';
import { Glicemia } from '../../glycemia/entities/glicemia.entity';
import { Insulina } from '../../insulin/entities/insulina.entity';
import { Lembrete } from '../../reminders/entities/lembrete.entity';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 150 }) nome: string;

  @Column({ type: 'varchar', length: 150, unique: true }) email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255 }) senhaHash: string;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true }) dataNascimento: Date;

  @CreateDateColumn({ name: 'created_at' })  created_At: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updated_At: Date;

  @OneToOne(() => Perfil, (perfil) => perfil.user) perfil: Perfil;

  @OneToMany(() => Glicemia, (glicemia) => glicemia.user) glicemias: Glicemia[];

  @OneToMany(() => Insulina, (insulina) => insulina.user) insulinas: Insulina[];

  @OneToMany(() => Lembrete, (lembrete) => lembrete.user) lembretes: Lembrete[];
}