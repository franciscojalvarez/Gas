import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './Usuario.entity';

export enum EstadoCompra {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado'
}

@Entity('compras_gasnet')
export class CompraGasnet {
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

  @Column({ default: EstadoCompra.PENDIENTE })
  estado: EstadoCompra;

  @Column({ name: 'metodo_pago', nullable: true })
  metodoPago: string;

  @Column({ name: 'referencia_pago', nullable: true })
  referenciaPago: string;
}

