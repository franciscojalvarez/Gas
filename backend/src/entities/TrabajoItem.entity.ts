import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('trabajos_items')
export class TrabajoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @UpdateDateColumn({ name: 'fecha_actualizacion', nullable: true })
  fechaActualizacion: Date;

  @Column({ default: true })
  activo: boolean;
}

