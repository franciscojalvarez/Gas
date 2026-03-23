import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity('transacciones_puntos')
export class TransaccionPunto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, usuario => usuario.transacciones)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column()
  tipo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  puntos: number;

  @Column({ nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}

