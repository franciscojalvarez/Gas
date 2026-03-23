# App Gasnet

Aplicación completa en TypeScript para Profesionales Instaladores Sanitaristas y Gas

## Estructura del Proyecto

```
gas/
├── backend/          # API Backend (TypeScript + Express + TypeORM + PostgreSQL)
├── frontend/         # Frontend (React + TypeScript)
└── docker-compose.yml # Configuración de Docker para PostgreSQL
```

## Requisitos Previos

- Node.js (v16 o superior)
- Docker y Docker Compose
- npm o yarn

## Instalación Rápida

### 1. Iniciar Base de Datos

```bash
docker-compose up -d postgres
```

### 2. Configurar y Ejecutar Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env si es necesario
npm run seed  # Poblar base de datos con datos iniciales
npm run dev   # Inicia el servidor en desarrollo
```

El backend estará corriendo en `http://localhost:5000`

### 3. Configurar y Ejecutar Frontend

```bash
cd frontend
npm install
npm start
```

El frontend estará corriendo en `http://localhost:3000`

## Conexión a Base de Datos (DBeaver)

- **Tipo**: PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: gasnet
- **Username**: gasnet
- **Password**: gasnet123

## Estructura de Carpetas

### Backend (TypeScript)
```
backend/
├── src/
│   ├── config/          # Configuración (base de datos)
│   ├── entities/        # Entidades TypeORM (18 entidades)
│   ├── routes/          # Rutas de la API (TypeScript)
│   ├── middleware/      # Middlewares (auth, error handling)
│   ├── scripts/         # Scripts de utilidad (seed)
│   └── index.ts         # Punto de entrada
├── dist/                # Código compilado
└── package.json
```

### Frontend (TypeScript)
```
frontend/
├── src/
│   ├── components/      # Componentes React (.tsx)
│   ├── context/         # Context API (AuthContext.tsx)
│   ├── api/             # Cliente API (axios.ts)
│   ├── types/           # Tipos e interfaces TypeScript
│   └── App.tsx          # Componente principal
├── public/
└── package.json
```

## Tecnologías

### Backend
- **TypeScript** - Lenguaje de programación
- **Express.js** - Framework web
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **xlsx** - Manejo de archivos Excel

### Frontend
- **React 18** - Librería de UI
- **TypeScript** - Lenguaje de programación
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **XLSX** - Manejo de archivos Excel

## Scripts Disponibles

### Backend
- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm run build` - Compila TypeScript a JavaScript
- `npm run start` - Inicia el servidor en producción
- `npm run seed` - Ejecuta el script de seed para datos iniciales

### Frontend
- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm test` - Ejecuta las pruebas

## Características

### Sistema de Autenticación
- Registro de usuarios
- Login con JWT
- Sistema de roles (Administrador, Instalador, Usuario)
- Sistema de permisos granular

### 6 Bloques Funcionales

1. **Bloque 1: Presupuesto Mano de Obra**
   - 20 ítems configurables
   - Importación/Exportación Excel
   - Historial de presupuestos

2. **Bloque 2: Compra de Accesorios Gasnet**
   - 20 artículos
   - Sistema de compra con transferencia bancaria
   - Acumulación automática de puntos

3. **Bloque 3: Presupuesto por Materiales**
   - 4 proveedores
   - 80 artículos por proveedor
   - Comparación de precios

4. **Bloque 4: Sistema de Puntos**
   - $1000 = 1 punto
   - Historial de transacciones
   - Gestión de usuarios

5. **Bloque 5: Capacitaciones**
   - 5 capacitaciones anuales
   - Sistema de inscripción con puntos
   - Contenidos detallados

6. **Bloque 6: Bolsa de Trabajo**
   - Gestión de pedidos de trabajo
   - 20 ítems de trabajos
   - Presupuestos automáticos

## Desarrollo

La base de datos se sincroniza automáticamente en desarrollo (`synchronize: true` en `database.ts`). En producción, usar migraciones.

Para más información sobre cada módulo, consulta los README.md en cada carpeta.

## Notas

- Todos los archivos están en TypeScript (.ts, .tsx)
- La base de datos está en Docker y es accesible desde DBeaver
- El código está completamente modularizado y tipado
