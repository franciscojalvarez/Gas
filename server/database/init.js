const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'gasnet.db');

let db = null;

function init() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Bloque 1: Mano de Obra
      db.run(`CREATE TABLE IF NOT EXISTS mano_obra_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio_unitario REAL NOT NULL,
        fecha_actualizacion TEXT,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS presupuestos_mano_obra (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        items TEXT
      )`);

      // Bloque 2: Accesorios Gasnet
      db.run(`CREATE TABLE IF NOT EXISTS accesorios_gasnet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo TEXT,
        precio_unitario REAL NOT NULL,
        fecha_actualizacion TEXT,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS compras_gasnet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        items TEXT,
        estado TEXT DEFAULT 'pendiente',
        metodo_pago TEXT,
        referencia_pago TEXT
      )`);

      // Bloque 3: Materiales
      db.run(`CREATE TABLE IF NOT EXISTS proveedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo TEXT,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS precios_materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proveedor_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        fecha_actualizacion TEXT,
        UNIQUE(proveedor_id, material_id),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
        FOREIGN KEY (material_id) REFERENCES materiales(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS presupuestos_materiales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        proveedor_id INTEGER,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        items TEXT,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
      )`);

      // Sistema de Autenticación y Usuarios
      db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        descripcion TEXT,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        descripcion TEXT,
        modulo TEXT,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS roles_permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permiso_id INTEGER NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permiso_id) REFERENCES permisos(id),
        UNIQUE(role_id, permiso_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT NOT NULL,
        apellido TEXT,
        telefono TEXT,
        role_id INTEGER DEFAULT 2,
        puntos_acumulados REAL DEFAULT 0,
        activo INTEGER DEFAULT 1,
        fecha_registro TEXT DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso TEXT,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS transacciones_puntos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        monto REAL,
        puntos REAL,
        descripcion TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )`);

      // Bloque 5: Capacitaciones
      db.run(`CREATE TABLE IF NOT EXISTS capacitaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        contenido TEXT,
        puntos_requeridos REAL NOT NULL,
        activa INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS inscripciones_capacitaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        capacitacion_id INTEGER NOT NULL,
        fecha_inscripcion TEXT DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'inscrito',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (capacitacion_id) REFERENCES capacitaciones(id)
      )`);

      // Bloque 6: Bolsa de Trabajo
      db.run(`CREATE TABLE IF NOT EXISTS tipos_trabajo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS trabajos_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio_unitario REAL NOT NULL,
        fecha_actualizacion TEXT,
        activo INTEGER DEFAULT 1
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS pedidos_trabajo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_trabajo_id INTEGER,
        direccion TEXT NOT NULL,
        contacto_cliente TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        total REAL,
        items TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'pendiente',
        FOREIGN KEY (tipo_trabajo_id) REFERENCES tipos_trabajo(id)
      )`);

      // Insertar datos iniciales
      insertInitialData().then(() => {
        console.log('Database initialized successfully');
        resolve();
      }).catch(reject);
    });
  });
}

function insertInitialData() {
  return new Promise((resolve, reject) => {
    // Insertar proveedores
    db.run(`INSERT OR IGNORE INTO proveedores (id, nombre) VALUES 
      (1, 'Proveedor A'),
      (2, 'Proveedor B'),
      (3, 'Proveedor C'),
      (4, 'Proveedor D')`);

    // Insertar capacitaciones iniciales
    db.run(`INSERT OR IGNORE INTO capacitaciones (id, nombre, descripcion, contenido, puntos_requeridos) VALUES 
      (1, 'Capacitación 1', 'Primera capacitación anual', 'Contenido detallado de la capacitación 1...', 10),
      (2, 'Capacitación 2', 'Segunda capacitación anual', 'Contenido detallado de la capacitación 2...', 15),
      (3, 'Capacitación 3', 'Tercera capacitación anual', 'Contenido detallado de la capacitación 3...', 20),
      (4, 'Capacitación 4', 'Cuarta capacitación anual', 'Contenido detallado de la capacitación 4...', 25),
      (5, 'Capacitación 5', 'Quinta capacitación anual', 'Contenido detallado de la capacitación 5...', 30)`);

    // Insertar tipos de trabajo iniciales
    db.run(`INSERT OR IGNORE INTO tipos_trabajo (id, nombre) VALUES 
      (1, 'Instalación de Gas'),
      (2, 'Instalación Sanitaria'),
      (3, 'Mantenimiento'),
      (4, 'Reparación'),
      (5, 'Inspección')`);

    resolve();
  });
}

function getDb() {
  return db;
}

module.exports = { init, getDb };

