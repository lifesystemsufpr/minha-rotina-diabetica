import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('insulinas')
export class Insulina {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'data_hora', type: 'datetime' }) dataHora: Date;

  @Column({ type: 'varchar', length: 50 }) tipo: string;

  @Column({ name: 'dose_ui', type: 'decimal', precision: 6, scale: 2 }) doseUi: number;

  @Column({ name: 'local_aplicacao', type: 'varchar', length: 50, nullable: true }) localAplicacao: string;

  @Column({ type: 'text', nullable: true }) observacao: string;

  @CreateDateColumn({ name: 'created_at' }) created_At: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updated_At: Date;

  @ManyToOne(() => User, (user) => user.insulinas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' }) user: User;
}