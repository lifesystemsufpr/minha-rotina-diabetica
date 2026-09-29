import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, } from 'typeorm';import { User } from './user.entity';

@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'tipo_diabetes', type: 'varchar', length: 50, nullable: true }) tipoDiabetes: string;

  @Column({ name: 'altura_cm', type: 'decimal', precision: 5, scale: 2, nullable: true }) alturaCm: number;

  @Column({ name: 'peso_kg', type: 'decimal', precision: 5, scale: 2, nullable: true }) pesoKg: number;

  @Column({ name: 'contato_emergencia_nome', type: 'varchar', length: 100, nullable: true }) contatoEmergenciaNome: string;

  @Column({ name: 'contato_emergencia_relacao', type: 'varchar', length: 50, nullable: true })contatoEmergenciaRelacao: string;

  @Column({ name: 'contato_emergencia_telefone', type: 'varchar', length: 20, nullable: true }) contatoEmergenciaTelefone: string;

  @CreateDateColumn({ name: 'created_at' })created_At: Date;

  @UpdateDateColumn({ name: 'updated_at' })updated_At: Date;

  @OneToOne(() => User, (user) => user.perfil, { onDelete: 'CASCADE' })
  
  @JoinColumn({ name: 'usuario_id' })user: User;
}