import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PrecioMaterial } from './PrecioMaterial.entity';

@Entity('proveedores')
export class Proveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => PrecioMaterial, precio => precio.proveedor)
  precios: PrecioMaterial[];
}

