import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Capacitacion } from '../entities/Capacitacion.entity';
import { InscripcionCapacitacion, EstadoInscripcion } from '../entities/InscripcionCapacitacion.entity';
import { Usuario } from '../entities/Usuario.entity';
import { TransaccionPunto } from '../entities/TransaccionPunto.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener todas las capacitaciones
router.get('/capacitaciones', async (req: Request, res: Response) => {
  try {
    const capacitacionRepo = AppDataSource.getRepository(Capacitacion);
    const capacitaciones = await capacitacionRepo.find({
      where: { activa: true },
      order: { puntosRequeridos: 'ASC' }
    });
    res.json(capacitaciones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una capacitación específica
router.get('/capacitaciones/:id', async (req: Request, res: Response) => {
  try {
    const capacitacionRepo = AppDataSource.getRepository(Capacitacion);
    const capacitacion = await capacitacionRepo.findOne({
      where: { id: parseInt(req.params.id) }
    });
    res.json(capacitacion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Inscribirse a una capacitación
router.post('/inscripcion', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { capacitacion_id } = req.body;
    const usuarioId = req.user!.id;

    const capacitacionRepo = AppDataSource.getRepository(Capacitacion);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const inscripcionRepo = AppDataSource.getRepository(InscripcionCapacitacion);
    const transaccionRepo = AppDataSource.getRepository(TransaccionPunto);

    const capacitacion = await capacitacionRepo.findOne({
      where: { id: capacitacion_id }
    });

    if (!capacitacion) {
      return res.status(404).json({ error: 'Capacitación no encontrada' });
    }

    const usuario = await usuarioRepo.findOne({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.puntosAcumulados < capacitacion.puntosRequeridos) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }

    const inscripcion = inscripcionRepo.create({
      usuarioId,
      capacitacionId: capacitacion_id,
      estado: EstadoInscripcion.INSCRITO
    });

    const saved = await inscripcionRepo.save(inscripcion);

    usuario.puntosAcumulados -= capacitacion.puntosRequeridos;
    await usuarioRepo.save(usuario);

    await transaccionRepo.save({
      usuarioId,
      tipo: 'capacitacion',
      puntos: -capacitacion.puntosRequeridos,
      descripcion: `Inscripción a ${capacitacion.nombre}`
    });

    res.json({ success: true, inscripcion_id: saved.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener inscripciones del usuario actual
router.get('/inscripciones/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const inscripcionRepo = AppDataSource.getRepository(InscripcionCapacitacion);
    const inscripciones = await inscripcionRepo.find({
      where: { usuarioId: req.user!.id },
      relations: ['capacitacion'],
      order: { fechaInscripcion: 'DESC' }
    });

    const result = inscripciones.map(i => ({
      ...i,
      capacitacion_nombre: i.capacitacion.nombre,
      descripcion: i.capacitacion.descripcion,
      contenido: i.capacitacion.contenido,
      puntos_requeridos: i.capacitacion.puntosRequeridos
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

