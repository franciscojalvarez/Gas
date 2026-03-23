import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PedidoTrabajo } from './PedidoTrabajo.entity';

@Entity('tipos_trabajo')
export class TipoTrabajo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => PedidoTrabajo, pedido => pedido.tipoTrabajo)
  pedidos: PedidoTrabajo[];
}

