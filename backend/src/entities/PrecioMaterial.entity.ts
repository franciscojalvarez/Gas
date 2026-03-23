import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Proveedor } from './Proveedor.entity';
import { Material } from './Material.entity';

@Entity('precios_materiales')
@Unique(['proveedor', 'material'])
export class PrecioMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Proveedor, proveedor => proveedor.precios)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @Column({ name: 'proveedor_id' })
  proveedorId: number;

  @ManyToOne(() => Material, material => material.precios)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @UpdateDateColumn({ name: 'fecha_actualizacion', nullable: true })
  fechaActualizacion: Date;
}

