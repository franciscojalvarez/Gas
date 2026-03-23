import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Role } from './Role.entity';
import { Permiso } from './Permiso.entity';

@Entity('roles_permisos')
@Unique(['role', 'permiso'])
export class RolPermiso {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, role => role.rolesPermisos)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permiso, permiso => permiso.rolesPermisos)
  @JoinColumn({ name: 'permiso_id' })
  permiso: Permiso;
}

