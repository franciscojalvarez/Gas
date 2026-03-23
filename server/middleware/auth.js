const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'gasnet_secret_key_change_in_production';

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar permisos
function checkPermission(permisoNombre) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const db = getDb();
    
    // Obtener permisos del usuario
    db.get(
      `SELECT p.nombre 
       FROM permisos p
       JOIN roles_permisos rp ON p.id = rp.permiso_id
       JOIN usuarios u ON u.role_id = rp.role_id
       WHERE u.id = ? AND p.nombre = ? AND p.activo = 1 AND u.activo = 1`,
      [req.user.id, permisoNombre],
      (err, permiso) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar permisos' });
        }

        if (!permiso) {
          return res.status(403).json({ error: 'No tiene permiso para realizar esta acción' });
        }

        next();
      }
    );
  };
}

// Middleware para verificar roles
function checkRole(roleNombre) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const db = getDb();
    
    db.get(
      `SELECT r.nombre 
       FROM roles r
       JOIN usuarios u ON u.role_id = r.id
       WHERE u.id = ? AND r.nombre = ? AND r.activo = 1 AND u.activo = 1`,
      [req.user.id, roleNombre],
      (err, role) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar rol' });
        }

        if (!role) {
          return res.status(403).json({ error: 'No tiene el rol necesario para esta acción' });
        }

        next();
      }
    );
  };
}

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      role_id: user.role_id 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = {
  authenticateToken,
  checkPermission,
  checkRole,
  generateToken,
  JWT_SECRET
};

