import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('accesorios_gasnet')
export class AccesorioGasnet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  codigo: string;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @UpdateDateColumn({ name: 'fecha_actualizacion', nullable: true })
  fechaActualizacion: Date;

  @Column({ default: true })
  activo: boolean;
}

