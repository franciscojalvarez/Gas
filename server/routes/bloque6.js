const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Obtener tipos de trabajo
router.get('/tipos-trabajo', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM tipos_trabajo WHERE activo = 1 ORDER BY nombre', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtener items de trabajos
router.get('/items', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM trabajos_items WHERE activo = 1 ORDER BY id', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Crear o actualizar items de trabajos (para importar desde Excel)
router.post('/items', (req, res) => {
  const db = getDb();
  const { items } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    items.forEach((item) => {
      if (item.id) {
        db.run(
          'UPDATE trabajos_items SET nombre = ?, precio_unitario = ?, fecha_actualizacion = ? WHERE id = ?',
          [item.nombre, item.precio_unitario, new Date().toISOString(), item.id]
        );
      } else {
        db.run(
          'INSERT INTO trabajos_items (nombre, precio_unitario, fecha_actualizacion) VALUES (?, ?, ?)',
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

// Crear pedido de trabajo
router.post('/pedido', (req, res) => {
  const db = getDb();
  const { tipo_trabajo_id, direccion, contacto_cliente, telefono, email, items } = req.body;

  // Calcular total
  let total = 0;
  items.forEach(item => {
    total += item.cantidad * item.precio_unitario;
  });

  db.run(
    'INSERT INTO pedidos_trabajo (tipo_trabajo_id, direccion, contacto_cliente, telefono, email, total, items) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [tipo_trabajo_id, direccion, contacto_cliente, telefono || null, email || null, total, JSON.stringify(items)],
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

// Obtener pedidos de trabajo
router.get('/pedidos', (req, res) => {
  const db = getDb();
  db.all(
    `SELECT pt.*, tt.nombre as tipo_trabajo_nombre
     FROM pedidos_trabajo pt
     LEFT JOIN tipos_trabajo tt ON pt.tipo_trabajo_id = tt.id
     ORDER BY pt.fecha_creacion DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Actualizar estado de pedido
router.put('/pedido/:id', (req, res) => {
  const db = getDb();
  const { estado } = req.body;

  db.run(
    'UPDATE pedidos_trabajo SET estado = ? WHERE id = ?',
    [estado, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;


