import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Role } from './Role.entity';
// Importamos las entidades con las que se relaciona el usuario
import { InscripcionCapacitacion } from './InscripcionCapacitacion.entity';
import { TransaccionPunto } from './TransaccionPunto.entity'; 
// Si tienes pedidos de trabajo, descomenta la siguiente línea e importa la entidad
// import { PedidoTrabajo } from './PedidoTrabajo.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column() // Contraseña obligatoria
  password: string;

  @Column({ name: 'puntos_acumulados', default: 0 })
  puntos_acumulados: number;

  @Column({ default: true })
  activo: boolean;

  // --- RELACIONES ---

  @ManyToOne(() => Role, (role) => role.usuarios)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => InscripcionCapacitacion, (inscripcion) => inscripcion.usuario)
  inscripciones: InscripcionCapacitacion[];

  @OneToMany(() => TransaccionPunto, (transaccion) => transaccion.usuario)
  transacciones: TransaccionPunto[];

  // Si en el futuro te da error con "pedidos", descomenta esto:
  // @OneToMany(() => PedidoTrabajo, (pedido) => pedido.usuario)
  // pedidos: PedidoTrabajo[];
}