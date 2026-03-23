# Solución para Problema de Docker

## El problema
Docker Desktop no está corriendo en tu sistema. El error `El sistema no puede encontrar el archivo especificado` para el pipe `dockerDesktopLinuxEngine` indica que Docker Desktop no está iniciado.

## Soluciones

### Opción 1: Iniciar Docker Desktop Manualmente

1. **Buscar Docker Desktop en Windows:**
   - Presiona `Windows + S`
   - Escribe "Docker Desktop"
   - Haz clic para abrirlo

2. **Verificar que esté corriendo:**
   - Busca el ícono de la ballena de Docker en la bandeja del sistema (abajo a la derecha, cerca del reloj)
   - Debe decir "Docker Desktop is running"
   - Puede tardar unos minutos en iniciar completamente

3. **Una vez corriendo, ejecuta:**
   ```bash
   docker-compose up -d
   ```

### Opción 2: Instalar Docker Desktop (si no está instalado)

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/
2. Ejecuta el instalador
3. Sigue las instrucciones (puede requerir reiniciar Windows)
4. Inicia Docker Desktop desde el menú de inicio
5. Espera a que termine de iniciar
6. Ejecuta `docker-compose up -d`

### Opción 3: Usar PostgreSQL Local (Alternativa sin Docker)

Si Docker sigue dando problemas, puedes instalar PostgreSQL directamente en Windows:

1. **Descargar PostgreSQL:**
   - https://www.postgresql.org/download/windows/
   - O usar el instalador oficial: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Durante la instalación:**
   - Usuario: `gasnet`
   - Contraseña: `gasnet123`
   - Puerto: `5432`
   - Base de datos: `gasnet` (crearla después)

3. **Crear la base de datos:**
   ```sql
   CREATE DATABASE gasnet;
   CREATE USER gasnet WITH PASSWORD 'gasnet123';
   GRANT ALL PRIVILEGES ON DATABASE gasnet TO gasnet;
   ```

4. **Actualizar el backend/.env:**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=gasnet
   DB_PASSWORD=gasnet123
   DB_DATABASE=gasnet
   ```

5. **Ejecutar el backend normalmente** (sin docker-compose)

## Verificar estado de Docker

Ejecuta estos comandos para diagnosticar:

```powershell
# Ver si Docker Desktop está corriendo
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

# Ver si está instalado
Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Intentar iniciar Docker Desktop desde PowerShell (si está instalado)
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

## Recomendación

Si Docker Desktop no está instalado o sigue dando problemas, la **Opción 3 (PostgreSQL Local)** es más rápida y simple para desarrollo en Windows.

