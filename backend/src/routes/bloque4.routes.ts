import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario.entity';
import { TransaccionPunto } from '../entities/TransaccionPunto.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener usuario y sus puntos (usuario actual)
router.get('/usuario/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: { id: req.user!.id }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

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

// Obtener transacciones de puntos del usuario actual
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

// Obtener todos los usuarios (solo para administradores)
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
      role_id: u.roleId
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

