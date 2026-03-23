import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity('presupuestos_mano_obra')
export class PresupuestoManoObra {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column('jsonb', { nullable: true })
  items: any;
}

