const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Obtener todos los items de mano de obra
router.get('/items', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM mano_obra_items WHERE activo = 1 ORDER BY id', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtener un item específico
router.get('/items/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM mano_obra_items WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Crear o actualizar items (para importar desde Excel)
router.post('/items', (req, res) => {
  const db = getDb();
  const { items } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    items.forEach((item) => {
      if (item.id) {
        // Actualizar
        db.run(
          'UPDATE mano_obra_items SET nombre = ?, precio_unitario = ?, fecha_actualizacion = ? WHERE id = ?',
          [item.nombre, item.precio_unitario, new Date().toISOString(), item.id]
        );
      } else {
        // Insertar
        db.run(
          'INSERT INTO mano_obra_items (nombre, precio_unitario, fecha_actualizacion) VALUES (?, ?, ?)',
          [item.nombre, item.precio_unitario, new Date().toISOString()]
        );
      }
    });

    db.run('COMMIT', (err) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    });
  });
});

// Crear presupuesto
router.post('/presupuesto', authenticateToken, (req, res) => {
  const db = getDb();
  const { items } = req.body;
  const usuario_id = req.user.id;

  // Calcular total
  let total = 0;
  items.forEach(item => {
    total += item.cantidad * item.precio_unitario;
  });

  db.run(
    'INSERT INTO presupuestos_mano_obra (usuario_id, total, items) VALUES (?, ?, ?)',
    [usuario_id || null, total, JSON.stringify(items)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        total,
        items 
      });
    }
  );
});

// Obtener presupuestos
router.get('/presupuestos', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM presupuestos_mano_obra ORDER BY fecha_creacion DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;


