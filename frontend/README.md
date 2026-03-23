# Gasnet Frontend

Frontend React con TypeScript para la aplicación Gasnet.

## Instalación

```bash
npm install
```

## Scripts

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm test` - Ejecuta las pruebas

## Desarrollo

El frontend se conecta automáticamente al backend en `http://localhost:5000` mediante el proxy configurado.

## Estructura

```
frontend/
├── src/
│   ├── components/     # Componentes React
│   ├── context/        # Context API (Auth)
│   ├── api/            # Cliente API (axios)
│   ├── types/          # Tipos TypeScript
│   └── App.tsx         # Componente principal
├── public/
└── package.json
```

## Tecnologías

- React 18
- TypeScript
- React Router
- Axios
- XLSX (para Excel)

