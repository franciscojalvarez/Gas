const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Obtener todos los accesorios Gasnet
router.get('/accesorios', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM accesorios_gasnet WHERE activo = 1 ORDER BY id', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Crear o actualizar accesorios (para importar desde Excel)
router.post('/accesorios', (req, res) => {
  const db = getDb();
  const { items } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    items.forEach((item) => {
      if (item.id) {
        db.run(
          'UPDATE accesorios_gasnet SET nombre = ?, codigo = ?, precio_unitario = ?, fecha_actualizacion = ? WHERE id = ?',
          [item.nombre, item.codigo, item.precio_unitario, new Date().toISOString(), item.id]
        );
      } else {
        db.run(
          'INSERT INTO accesorios_gasnet (nombre, codigo, precio_unitario, fecha_actualizacion) VALUES (?, ?, ?, ?)',
          [item.nombre, item.codigo, item.precio_unitario, new Date().toISOString()]
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

// Crear compra
router.post('/compra', authenticateToken, (req, res) => {
  const db = getDb();
  const { items, metodo_pago, referencia_pago } = req.body;
  const usuario_id = req.user.id;

  // Calcular total
  let total = 0;
  items.forEach(item => {
    total += item.cantidad * item.precio_unitario;
  });

  db.run(
    'INSERT INTO compras_gasnet (usuario_id, total, items, metodo_pago, referencia_pago, estado) VALUES (?, ?, ?, ?, ?, ?)',
    [usuario_id || null, total, JSON.stringify(items), metodo_pago || 'transferencia', referencia_pago || null, 'pendiente'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Calcular puntos (si hay usuario_id)
      if (usuario_id) {
        const puntos = total / 1000; // $1000 = 1 punto
        db.run(
          'INSERT INTO transacciones_puntos (usuario_id, tipo, monto, puntos, descripcion) VALUES (?, ?, ?, ?, ?)',
          [usuario_id, 'compra', total, puntos, 'Compra de accesorios Gasnet']
        );
        db.run(
          'UPDATE usuarios SET puntos_acumulados = puntos_acumulados + ? WHERE id = ?',
          [puntos, usuario_id]
        );
      }

      res.json({ 
        id: this.lastID, 
        total,
        items,
        puntos_obtenidos: usuario_id ? total / 1000 : 0
      });
    }
  );
});

// Obtener compras
router.get('/compras', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM compras_gasnet ORDER BY fecha_creacion DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Actualizar estado de compra
router.put('/compra/:id', (req, res) => {
  const db = getDb();
  const { estado } = req.body;

  db.run(
    'UPDATE compras_gasnet SET estado = ? WHERE id = ?',
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


