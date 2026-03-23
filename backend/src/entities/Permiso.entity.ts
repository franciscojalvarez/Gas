import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolPermiso } from './RolPermiso.entity';

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  modulo: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => RolPermiso, rolPermiso => rolPermiso.permiso)
  rolesPermisos: RolPermiso[];
}

