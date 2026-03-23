import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario.entity';
import { Role } from '../entities/Role.entity';
import { Permiso } from '../entities/Permiso.entity';
import { TransaccionPunto } from '../entities/TransaccionPunto.entity';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

interface RegisterRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    roleId?: number;
  };
}

interface LoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

// Registro de nuevo usuario
router.post('/register', async (req: RegisterRequest, res: Response) => {
  try {
    const { username, email, password, nombre, apellido, telefono, roleId } = req.body;

    if (!username || !email || !password || !nombre) {
      return res.status(400).json({ error: 'Campos requeridos: username, email, password, nombre' });
    }

    const usuarioRepo = AppDataSource.getRepository(Usuario);

    const existingUser = await usuarioRepo.findOne({
      where: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = usuarioRepo.create({
      username,
      email,
      passwordHash,
      nombre,
      apellido: apellido,
      telefono: telefono,
      roleId: roleId || 2,
      puntosAcumulados: 0,
      activo: true
    });

    const savedUsuario = await usuarioRepo.save(usuario);

    const userWithRole = await usuarioRepo.findOne({
      where: { id: savedUsuario.id },
      relations: ['role']
    });

    if (!userWithRole) {
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }

    const token = generateToken({
      id: userWithRole.id,
      username: userWithRole.username,
      email: userWithRole.email,
      roleId: userWithRole.roleId
    });

    res.json({
      token,
      user: {
        id: userWithRole.id,
        username: userWithRole.username,
        email: userWithRole.email,
        nombre: userWithRole.nombre,
        apellido: userWithRole.apellido,
        roleId: userWithRole.roleId,
        roleNombre: userWithRole.role?.nombre,
        puntosAcumulados: userWithRole.puntosAcumulados
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req: LoginRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: [{ username }, { email: username }],
      relations: ['role']
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, usuario.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    usuario.ultimoAcceso = new Date();
    await usuarioRepo.save(usuario);

    const token = generateToken({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roleId: usuario.roleId
    });

    res.json({
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        roleId: usuario.roleId,
        roleNombre: usuario.role?.nombre,
        puntosAcumulados: usuario.puntosAcumulados
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuario actual
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: { id: req.user!.id },
      relations: ['role']
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono,
      roleId: usuario.roleId,
      puntosAcumulados: usuario.puntosAcumulados,
      fechaRegistro: usuario.fechaRegistro,
      ultimoAcceso: usuario.ultimoAcceso,
      roleNombre: usuario.role?.nombre,
      roleDescripcion: usuario.role?.descripcion
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener permisos del usuario actual
router.get('/permissions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const permisoRepo = AppDataSource.getRepository(Permiso);

    const permisos = await permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.rolesPermisos', 'rp')
      .innerJoin('rp.role', 'role')
      .innerJoin('role.usuarios', 'usuario')
      .where('usuario.id = :userId', { userId: req.user!.id })
      .andWhere('permiso.activo = true')
      .andWhere('usuario.activo = true')
      .getMany();

    res.json(permisos.map(p => p.nombre));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar contraseña
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOne({
      where: { id: req.user!.id }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, usuario.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    usuario.passwordHash = await bcrypt.hash(newPassword, 10);
    await usuarioRepo.save(usuario);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

