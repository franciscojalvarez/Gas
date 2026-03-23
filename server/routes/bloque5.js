const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Obtener todas las capacitaciones
router.get('/capacitaciones', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM capacitaciones WHERE activa = 1 ORDER BY puntos_requeridos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtener una capacitación específica
router.get('/capacitaciones/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM capacitaciones WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Crear o actualizar capacitación
router.post('/capacitaciones', (req, res) => {
  const db = getDb();
  const { id, nombre, descripcion, contenido, puntos_requeridos } = req.body;

  if (id) {
    // Actualizar
    db.run(
      'UPDATE capacitaciones SET nombre = ?, descripcion = ?, contenido = ?, puntos_requeridos = ? WHERE id = ?',
      [nombre, descripcion, contenido, puntos_requeridos, id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true });
      }
    );
  } else {
    // Crear
    db.run(
      'INSERT INTO capacitaciones (nombre, descripcion, contenido, puntos_requeridos) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, contenido, puntos_requeridos],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, success: true });
      }
    );
  }
});

// Inscribirse a una capacitación
router.post('/inscripcion', authenticateToken, (req, res) => {
  const db = getDb();
  const { capacitacion_id } = req.body;
  const usuario_id = req.user.id;

  // Verificar que el usuario tenga puntos suficientes
  db.get('SELECT puntos_requeridos FROM capacitaciones WHERE id = ?', [capacitacion_id], (err, capacitacion) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.get('SELECT puntos_acumulados FROM usuarios WHERE id = ?', [usuario_id], (err, usuario) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (usuario.puntos_acumulados < capacitacion.puntos_requeridos) {
        res.status(400).json({ error: 'Puntos insuficientes' });
        return;
      }

      // Crear inscripción
      db.run(
        'INSERT INTO inscripciones_capacitaciones (usuario_id, capacitacion_id) VALUES (?, ?)',
        [usuario_id, capacitacion_id],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // Descontar puntos
          db.run(
            'UPDATE usuarios SET puntos_acumulados = puntos_acumulados - ? WHERE id = ?',
            [capacitacion.puntos_requeridos, usuario_id]
          );

          // Registrar transacción
          db.run(
            'INSERT INTO transacciones_puntos (usuario_id, tipo, puntos, descripcion) VALUES (?, ?, ?, ?)',
            [usuario_id, 'capacitacion', -capacitacion.puntos_requeridos, `Inscripción a ${capacitacion.nombre}`]
          );

          res.json({ success: true, inscripcion_id: this.lastID });
        }
      );
    });
  });
});

// Obtener inscripciones del usuario actual
router.get('/inscripciones/me', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(
    `SELECT ic.*, c.nombre as capacitacion_nombre, c.descripcion, c.contenido, c.puntos_requeridos
     FROM inscripciones_capacitaciones ic
     JOIN capacitaciones c ON ic.capacitacion_id = c.id
     WHERE ic.usuario_id = ?
     ORDER BY ic.fecha_inscripcion DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

module.exports = router;


