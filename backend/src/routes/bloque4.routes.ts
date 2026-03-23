import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario.entity';
import { TransaccionPunto } from '../entities/TransaccionPunto.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener puntos del usuario actual
router.get('/usuario/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({ where: { id: req.user!.id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      puntos_acumulados: usuario.puntosAcumulados,
      fecha_registro: usuario.fechaRegistro
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Historial de transacciones del usuario actual
router.get('/transacciones/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const transaccionRepo = AppDataSource.getRepository(TransaccionPunto);
    const transacciones = await transaccionRepo.find({
      where: { usuarioId: req.user!.id },
      order: { fecha: 'DESC' }
    });
    res.json(transacciones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Todos los usuarios con sus puntos (admin)
router.get('/usuarios', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuarios = await usuarioRepo.find({
      where: { activo: true },
      relations: ['role'],
      order: { puntosAcumulados: 'DESC' }
    });
    const result = usuarios.map(u => ({
      id: u.id,
      username: u.username,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      puntos_acumulados: u.puntosAcumulados,
      fecha_registro: u.fechaRegistro,
      role_id: u.roleId,
      role_nombre: u.role?.nombre
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ranking de usuarios por puntos
router.get('/ranking', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuarios = await usuarioRepo.find({
      where: { activo: true },
      order: { puntosAcumulados: 'DESC' },
      take: 20
    });
    const result = usuarios.map((u, idx) => ({
      posicion: idx + 1,
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      puntos_acumulados: u.puntosAcumulados
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar puntos manualmente a un usuario (admin)
router.post('/agregar-puntos', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { usuario_id, puntos, descripcion } = req.body;
    if (!usuario_id || !puntos) return res.status(400).json({ error: 'usuario_id y puntos son requeridos' });

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const transaccionRepo = AppDataSource.getRepository(TransaccionPunto);

    const usuario = await usuarioRepo.findOne({ where: { id: usuario_id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    usuario.puntosAcumulados += Number(puntos);
    await usuarioRepo.save(usuario);

    await transaccionRepo.save({
      usuarioId: usuario_id,
      tipo: 'manual',
      puntos: Number(puntos),
      descripcion: descripcion || 'Puntos agregados manualmente'
    });

    res.json({ success: true, nuevos_puntos: usuario.puntosAcumulados });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Historial de transacciones de cualquier usuario (admin)
router.get('/transacciones/:usuarioId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const transaccionRepo = AppDataSource.getRepository(TransaccionPunto);
    const transacciones = await transaccionRepo.find({
      where: { usuarioId: Number(req.params.usuarioId) },
      order: { fecha: 'DESC' }
    });
    res.json(transacciones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
