import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { Permiso } from './Permiso.entity';
import { RolPermiso } from './RolPermiso.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Usuario, usuario => usuario.role)
  usuarios: Usuario[];

  @OneToMany(() => RolPermiso, rolPermiso => rolPermiso.role)
  rolesPermisos: RolPermiso[];
}

