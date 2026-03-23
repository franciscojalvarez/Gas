# Gasnet Backend

Backend API para la aplicación Gasnet construida con TypeScript, Express y TypeORM.

## Instalación

```bash
npm install
```

## Configuración

1. Copia `.env.example` a `.env` y configura las variables de entorno
2. Asegúrate de que Docker esté corriendo y ejecuta:
   ```bash
   docker-compose up -d
   ```

## Base de Datos

La aplicación usa PostgreSQL en Docker. Para iniciar la base de datos:

```bash
docker-compose up -d postgres
```

### Conectar con DBeaver

- Host: localhost
- Port: 5432
- Database: gasnet
- Username: gasnet
- Password: gasnet123

## Scripts

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila TypeScript a JavaScript
- `npm run start` - Inicia el servidor en producción
- `npm run seed` - Ejecuta el script de seed para datos iniciales

## Seed de datos iniciales

Para poblar la base de datos con datos iniciales:

```bash
ts-node src/scripts/seed.ts
```

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/         # Configuración de la base de datos
│   ├── entities/       # Entidades TypeORM
│   ├── routes/         # Rutas de la API
│   ├── middleware/     # Middlewares
│   ├── scripts/        # Scripts de utilidad (seed, etc)
│   └── index.ts        # Punto de entrada
├── dist/               # Código compilado
└── package.json
```

