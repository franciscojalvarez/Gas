import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { TipoTrabajo } from './TipoTrabajo.entity';

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en-proceso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}

@Entity('pedidos_trabajo')
export class PedidoTrabajo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TipoTrabajo, { nullable: true })
  @JoinColumn({ name: 'tipo_trabajo_id' })
  tipoTrabajo: TipoTrabajo;

  @Column({ name: 'tipo_trabajo_id', nullable: true })
  tipoTrabajoId: number;

  @Column()
  direccion: string;

  @Column({ name: 'contacto_cliente' })
  contactoCliente: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total: number;

  @Column('jsonb', { nullable: true })
  items: any;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ default: EstadoPedido.PENDIENTE })
  estado: EstadoPedido;
}

