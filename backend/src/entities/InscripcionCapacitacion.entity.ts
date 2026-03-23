import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { Capacitacion } from './Capacitacion.entity';

export enum EstadoInscripcion {
  INSCRITO = 'inscrito',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}

@Entity('inscripciones_capacitaciones')
export class InscripcionCapacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, usuario => usuario.inscripciones)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @ManyToOne(() => Capacitacion, capacitacion => capacitacion.inscripciones)
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  @Column({ name: 'capacitacion_id' })
  capacitacionId: number;

  @CreateDateColumn({ name: 'fecha_inscripcion' })
  fechaInscripcion: Date;

  @Column({ default: EstadoInscripcion.INSCRITO })
  estado: EstadoInscripcion;
}

