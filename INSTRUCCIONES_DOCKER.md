# Instrucciones para Docker

## Problema: Docker Desktop no está corriendo

El error indica que Docker Desktop no está iniciado en Windows.

### Solución:

1. **Iniciar Docker Desktop**
   - Busca "Docker Desktop" en el menú de inicio de Windows
   - Ábrelo y espera a que termine de iniciar (verás un ícono de ballena en la bandeja del sistema)
   - Espera hasta que el estado sea "Docker Desktop is running"

2. **Una vez que Docker Desktop esté corriendo, ejecuta:**

```bash
cd backend
docker-compose up -d
```

O desde la raíz del proyecto:

```bash
docker-compose up -d
```

### Verificar que Docker está corriendo:

```bash
docker ps
```

Deberías ver una lista de contenedores (puede estar vacía si no hay contenedores corriendo, pero no debería dar error).

### Si Docker Desktop no está instalado:

1. Descarga Docker Desktop para Windows desde: https://www.docker.com/products/docker-desktop/
2. Instálalo
3. Reinicia tu computadora si es necesario
4. Inicia Docker Desktop
5. Vuelve a ejecutar `docker-compose up -d`

