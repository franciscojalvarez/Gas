import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PrecioMaterial } from './PrecioMaterial.entity';

@Entity('materiales')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  codigo: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => PrecioMaterial, precio => precio.material)
  precios: PrecioMaterial[];
}

