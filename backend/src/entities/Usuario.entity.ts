import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { Role } from './Role.entity';
import { InscripcionCapacitacion } from './InscripcionCapacitacion.entity';
import { TransaccionPunto } from './TransaccionPunto.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  apellido?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'puntos_acumulados', default: 0 })
  puntosAcumulados: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'role_id', default: 2 })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.usuarios)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @Column({ name: 'ultimo_acceso', nullable: true })
  ultimoAcceso: Date;

  @OneToMany(() => InscripcionCapacitacion, (inscripcion) => inscripcion.usuario)
  inscripciones: InscripcionCapacitacion[];

  @OneToMany(() => TransaccionPunto, (transaccion) => transaccion.usuario)
  transacciones: TransaccionPunto[];
}
