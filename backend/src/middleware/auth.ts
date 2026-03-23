import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Permiso } from '../entities/Permiso.entity';
import { Role } from '../entities/Role.entity';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    roleId: number;
  };
}

export const JWT_SECRET = process.env.JWT_SECRET || 'gasnet_secret_key_change_in_production';

export function generateToken(user: { id: number; username: string; email: string; roleId: number }): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, roleId: user.roleId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token de acceso requerido' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string; roleId: number };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

export const checkPermission = (permisoNombre: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const permisoRepo = AppDataSource.getRepository(Permiso);
      const roleRepo = AppDataSource.getRepository(Role);

      const permiso = await permisoRepo
        .createQueryBuilder('permiso')
        .innerJoin('permiso.rolesPermisos', 'rp')
        .innerJoin('rp.role', 'role')
        .innerJoin('role.usuarios', 'usuario')
        .where('usuario.id = :userId', { userId: req.user.id })
        .andWhere('permiso.nombre = :permisoNombre', { permisoNombre })
        .andWhere('permiso.activo = true')
        .andWhere('usuario.activo = true')
        .getOne();

      if (!permiso) {
        res.status(403).json({ error: 'No tiene permiso para realizar esta acción' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
};

export const checkRole = (roleNombre: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const roleRepo = AppDataSource.getRepository(Role);
      const role = await roleRepo
        .createQueryBuilder('role')
        .innerJoin('role.usuarios', 'usuario')
        .where('usuario.id = :userId', { userId: req.user.id })
        .andWhere('role.nombre = :roleNombre', { roleNombre })
        .andWhere('role.activo = true')
        .andWhere('usuario.activo = true')
        .getOne();

      if (!role) {
        res.status(403).json({ error: 'No tiene el rol necesario para esta acción' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar rol' });
    }
  };
};

