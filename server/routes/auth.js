const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../database/init');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Registro de nuevo usuario
router.post('/register', async (req, res) => {
  const db = getDb();
  const { username, email, password, nombre, apellido, telefono, role_id } = req.body;

  // Validaciones básicas
  if (!username || !email || !password || !nombre) {
    return res.status(400).json({ error: 'Campos requeridos: username, email, password, nombre' });
  }

  // Verificar si el usuario ya existe
  db.get('SELECT id FROM usuarios WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    try {
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear usuario (por defecto role_id = 2 si no se especifica)
      db.run(
        'INSERT INTO usuarios (username, email, password_hash, nombre, apellido, telefono, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, email, passwordHash, nombre, apellido || null, telefono || null, role_id || 2],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error al crear usuario' });
          }

          // Obtener el usuario creado con su rol
          db.get(
            `SELECT u.*, r.nombre as role_nombre 
             FROM usuarios u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [this.lastID],
            (err, user) => {
              if (err) {
                return res.status(500).json({ error: 'Error al obtener usuario' });
              }

              const token = generateToken(user);
              res.json({
                token,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  nombre: user.nombre,
                  apellido: user.apellido,
                  role_id: user.role_id,
                  role_nombre: user.role_nombre,
                  puntos_acumulados: user.puntos_acumulados
                }
              });
            }
          );
        }
      );
    } catch (error) {
      return res.status(500).json({ error: 'Error al procesar contraseña' });
    }
  });
});

// Login
router.post('/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' });
  }

  // Buscar usuario
  db.get(
    `SELECT u.*, r.nombre as role_nombre 
     FROM usuarios u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE (u.username = ? OR u.email = ?) AND u.activo = 1`,
    [username, username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error al buscar usuario' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      try {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último acceso
        db.run(
          'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        // Generar token
        const token = generateToken(user);

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            role_id: user.role_id,
            role_nombre: user.role_nombre,
            puntos_acumulados: user.puntos_acumulados
          }
        });
      } catch (error) {
        return res.status(500).json({ error: 'Error al verificar contraseña' });
      }
    }
  );
});

// Obtener usuario actual
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  
  db.get(
    `SELECT u.id, u.username, u.email, u.nombre, u.apellido, u.telefono, 
            u.role_id, u.puntos_acumulados, u.fecha_registro, u.ultimo_acceso,
            r.nombre as role_nombre, r.descripcion as role_descripcion
     FROM usuarios u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener usuario' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    }
  );
});

// Obtener permisos del usuario actual
router.get('/permissions', authenticateToken, (req, res) => {
  const db = getDb();
  
  db.all(
    `SELECT p.id, p.nombre, p.descripcion, p.modulo
     FROM permisos p
     JOIN roles_permisos rp ON p.id = rp.permiso_id
     JOIN usuarios u ON u.role_id = rp.role_id
     WHERE u.id = ? AND p.activo = 1 AND u.activo = 1`,
    [req.user.id],
    (err, permissions) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener permisos' });
      }

      res.json(permissions.map(p => p.nombre));
    }
  );
});

// Cambiar contraseña
router.post('/change-password', authenticateToken, async (req, res) => {
  const db = getDb();
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
  }

  // Obtener usuario
  db.get('SELECT password_hash FROM usuarios WHERE id = ?', [req.user.id], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    // Verificar contraseña actual
    try {
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Hashear nueva contraseña
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      db.run(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?',
        [newPasswordHash, req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error al actualizar contraseña' });
          }

          res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        }
      );
    } catch (error) {
      return res.status(500).json({ error: 'Error al procesar contraseña' });
    }
  });
});

module.exports = router;

