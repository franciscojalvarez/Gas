const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Obtener usuario y sus puntos (usuario actual)
router.get('/usuario/me', authenticateToken, (req, res) => {
  const db = getDb();
  db.get('SELECT id, nombre, email, puntos_acumulados, fecha_registro FROM usuarios WHERE id = ?', [req.user.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || { puntos_acumulados: 0 });
  });
});

// Obtener transacciones de puntos del usuario actual
router.get('/transacciones/me', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(
    'SELECT * FROM transacciones_puntos WHERE usuario_id = ? ORDER BY fecha DESC',
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

// Obtener todos los usuarios (solo para administradores)
router.get('/usuarios', authenticateToken, (req, res) => {
  const db = getDb();
  db.all('SELECT id, username, nombre, apellido, email, puntos_acumulados, fecha_registro, role_id FROM usuarios WHERE activo = 1 ORDER BY puntos_acumulados DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;


