const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Obtener todos los proveedores
router.get('/proveedores', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM proveedores WHERE activo = 1', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtener todos los materiales
router.get('/materiales', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM materiales WHERE activo = 1 ORDER BY nombre', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtener precios de materiales por proveedor
router.get('/precios/:proveedorId', (req, res) => {
  const db = getDb();
  const proveedorId = req.params.proveedorId;

  db.all(
    `SELECT m.id, m.nombre, m.codigo, pm.precio_unitario, pm.fecha_actualizacion 
     FROM materiales m
     LEFT JOIN precios_materiales pm ON m.id = pm.material_id AND pm.proveedor_id = ?
     WHERE m.activo = 1
     ORDER BY m.nombre`,
    [proveedorId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Actualizar precios de materiales (para importar desde Excel)
router.post('/precios/:proveedorId', (req, res) => {
  const db = getDb();
  const proveedorId = req.params.proveedorId;
  const { items } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const processItems = (index) => {
      if (index >= items.length) {
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ success: true });
        });
        return;
      }

      const item = items[index];

      // Buscar material existente
      db.get('SELECT id FROM materiales WHERE nombre = ?', [item.nombre], (err, existingMaterial) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        if (existingMaterial) {
          updatePrice(existingMaterial.id, () => processItems(index + 1));
        } else {
          // Crear nuevo material
          db.run(
            'INSERT INTO materiales (nombre, codigo) VALUES (?, ?)',
            [item.nombre, item.codigo || null],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              updatePrice(this.lastID, () => processItems(index + 1));
            }
          );
        }
      });

      function updatePrice(materialId, callback) {
        const fechaActualizacion = new Date().toISOString();
        
        // Intentar actualizar primero
        db.run(
          'UPDATE precios_materiales SET precio_unitario = ?, fecha_actualizacion = ? WHERE proveedor_id = ? AND material_id = ?',
          [item.precio_unitario, fechaActualizacion, proveedorId, materialId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            // Si no se actualizó ninguna fila, insertar
            if (this.changes === 0) {
              db.run(
                'INSERT INTO precios_materiales (proveedor_id, material_id, precio_unitario, fecha_actualizacion) VALUES (?, ?, ?, ?)',
                [proveedorId, materialId, item.precio_unitario, fechaActualizacion],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  callback();
                }
              );
            } else {
              callback();
            }
          }
        );
      }
    };

    processItems(0);
  });
});

// Crear presupuesto de materiales
router.post('/presupuesto', authenticateToken, (req, res) => {
  const db = getDb();
  const { proveedor_id, items } = req.body;
  const usuario_id = req.user.id;

  // Calcular total
  let total = 0;
  items.forEach(item => {
    total += item.cantidad * item.precio_unitario;
  });

  db.run(
    'INSERT INTO presupuestos_materiales (usuario_id, proveedor_id, total, items) VALUES (?, ?, ?, ?)',
    [usuario_id || null, proveedor_id, total, JSON.stringify(items)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        total,
        items,
        proveedor_id
      });
    }
  );
});

// Obtener presupuestos de materiales
router.get('/presupuestos', (req, res) => {
  const db = getDb();
  db.all(
    `SELECT pm.*, p.nombre as proveedor_nombre 
     FROM presupuestos_materiales pm
     LEFT JOIN proveedores p ON pm.proveedor_id = p.id
     ORDER BY pm.fecha_creacion DESC`,
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

module.exports = router;

