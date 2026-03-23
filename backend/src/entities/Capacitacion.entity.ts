import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InscripcionCapacitacion } from './InscripcionCapacitacion.entity';

@Entity('capacitaciones')
export class Capacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  contenido: string;

  @Column({ name: 'puntos_requeridos', type: 'decimal', precision: 10, scale: 2 })
  puntosRequeridos: number;

  @Column({ default: true })
  activa: boolean;

  @OneToMany(() => InscripcionCapacitacion, inscripcion => inscripcion.capacitacion)
  inscripciones: InscripcionCapacitacion[];
}

