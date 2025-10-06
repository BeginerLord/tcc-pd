# 🐳 Docker Quick Start - SIMA Scraper

## 📋 Pre-requisitos

- Docker Desktop instalado y corriendo
- Puerto `8080`, `3000`, `3001`, `27017` disponibles

## 🚀 Pasos para Ejecutar Todo con Docker

### 1️⃣ Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
```

**Contenido mínimo de `.env`**:
```env
JWT_SECRET=mi-secreto-super-seguro-cambiar-en-produccion
ENCRYPTION_KEY=12345678901234567890123456789012
```

⚠️ **Importante**: `ENCRYPTION_KEY` debe tener exactamente 32 caracteres

---

### 2️⃣ Construir y Levantar Servicios

```bash
# Opción 1: Build y start en un solo comando
docker-compose up -d --build

# Opción 2: Build primero, luego start
docker-compose build
docker-compose up -d
```

**Explicación de flags**:
- `-d`: Modo detached (corre en background)
- `--build`: Fuerza rebuild de imágenes

---

### 3️⃣ Verificar que Todo Esté Corriendo

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api-gateway
docker-compose logs -f main-api
docker-compose logs -f scraping-service
docker-compose logs -f mongodb
```

**Resultado esperado**:
```
NAME                    STATUS          PORTS
sima-api-gateway        Up              0.0.0.0:8080->8080/tcp
sima-main-api           Up              0.0.0.0:3000->3000/tcp
sima-scraping-service   Up              0.0.0.0:3001->3001/tcp
sima-mongodb            Up              0.0.0.0:27017->27017/tcp
```

---

### 4️⃣ Probar Health Checks

```bash
# Desde terminal (requiere curl)
curl http://localhost:8080/api/health
curl http://localhost:3000/health
curl http://localhost:3001/api/scraping/health

# O abre en navegador
http://localhost:8080/api/health
```

**Respuesta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T..."
}
```

---

## 🔧 Configuración de Postman para Docker

### URLs a Usar

Cuando todo corre en Docker, usa estas URLs en Postman:

```
✅ API Gateway (Punto de entrada principal)
   http://localhost:8080

✅ Main API (Directo - opcional)
   http://localhost:3000

✅ Scraping Service (Directo - opcional)
   http://localhost:3001

✅ MongoDB
   mongodb://localhost:27017
```

### Variables de Postman

```json
BASE_URL = http://localhost:8080
SCRAPING_URL = http://localhost:3001
JWT_TOKEN = (se completa automáticamente al hacer login)
```

---

## 📮 Flujo de Prueba en Postman

### 1. Health Check
```http
GET http://localhost:8080/api/health
```

### 2. Registrar Usuario
```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "usuario_test",
  "password": "password123",
  "simaUsername": "tu.usuario.sima",
  "simaPassword": "tu_password_sima"
}
```

### 3. Login (Guarda JWT automáticamente)
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "usuario_test",
  "password": "password123"
}
```

**Respuesta**:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "username": "usuario_test"
  }
}
```

### 4. Sincronizar Cursos desde SIMA
```http
POST http://localhost:8080/api/courses/sync
Authorization: Bearer {{JWT_TOKEN}}
```

### 5. Obtener Horario Semanal (con fechas apertura/cierre)
```http
GET http://localhost:8080/api/schedule/week
Authorization: Bearer {{JWT_TOKEN}}
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-06",
      "activities": [
        {
          "id": "123",
          "title": "Protocolo individual de la unidad 2",
          "startTime": "15:23",
          "type": "assignment",
          "activityDates": {
            "apertura": "lunes, 18 de agosto de 2025, 15:23",
            "cierre": "sábado, 11 de octubre de 2025, 15:23"
          }
        }
      ]
    }
  ]
}
```

---

## 🛠️ Comandos Útiles de Docker

### Ver Logs
```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f api-gateway
docker-compose logs -f main-api
docker-compose logs -f scraping-service

# Últimas 100 líneas
docker-compose logs --tail=100
```

### Reiniciar Servicios
```bash
# Reiniciar todos
docker-compose restart

# Reiniciar uno específico
docker-compose restart api-gateway
docker-compose restart scraping-service
```

### Reconstruir Después de Cambios en Código
```bash
# Rebuild de un servicio específico
docker-compose up -d --build scraping-service

# Rebuild de todos
docker-compose up -d --build
```

### Detener Servicios
```bash
# Detener sin eliminar contenedores
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener, eliminar contenedores Y volúmenes (¡Borra la BD!)
docker-compose down -v
```

### Entrar a un Contenedor
```bash
# Entrar al contenedor de scraping-service
docker exec -it sima-scraping-service sh

# Entrar al contenedor de main-api
docker exec -it sima-main-api sh

# Ver estructura de archivos
docker exec -it sima-scraping-service ls -la /app
```

### Ver Recursos Usados
```bash
# CPU, memoria, red, disco
docker stats

# Espacio usado por Docker
docker system df
```

---

## 🐛 Troubleshooting

### Error: "Port 8080 is already in use"

**Solución 1**: Detener proceso usando el puerto
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

**Solución 2**: Cambiar puerto en `docker-compose.yml`
```yaml
api-gateway:
  ports:
    - "9090:8080"  # Usar puerto 9090 en lugar de 8080
```

---

### Error: "MongoDB connection failed"

**Causa**: MongoDB no inició correctamente

**Solución**:
```bash
# Ver logs de MongoDB
docker-compose logs mongodb

# Reiniciar MongoDB
docker-compose restart mongodb

# Si persiste, recrear contenedor
docker-compose down
docker-compose up -d
```

---

### Error: "Cannot find module" o "Module not found"

**Causa**: node_modules no se instaló en el contenedor

**Solución**:
```bash
# Rebuild forzado
docker-compose build --no-cache scraping-service
docker-compose up -d scraping-service
```

---

### Los cambios en código no se reflejan

**Causa**: Build cache de Docker

**Solución**:
```bash
# Rebuild sin cache
docker-compose build --no-cache
docker-compose up -d
```

---

### Error: "ENCRYPTION_KEY must be 32 characters"

**Solución**: Editar `.env`
```env
ENCRYPTION_KEY=12345678901234567890123456789012
```
(Exactamente 32 caracteres)

---

### Ver errores específicos de TypeScript

```bash
# Ver logs completos del servicio
docker-compose logs scraping-service

# Si hay errores de compilación TypeScript
docker exec -it sima-scraping-service npm run typecheck
```

---

## 📊 Arquitectura en Docker

```
┌─────────────────────────────────────────────────┐
│              Docker Network                      │
│              (sima-network)                      │
│                                                  │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │   MongoDB    │◄────────┤   Main API      │  │
│  │  Port 27017  │         │   Port 3000     │  │
│  └──────────────┘         └────────▲────────┘  │
│                                     │            │
│  ┌──────────────────────────────────┼────────┐  │
│  │        Scraping Service          │        │  │
│  │          Port 3001               │        │  │
│  └──────────────────────────────────▲────────┘  │
│                                     │            │
│  ┌──────────────────────────────────┼────────┐  │
│  │         API Gateway              │        │  │
│  │          Port 8080 ◄─────────────┘        │  │
│  └────────────────┬─────────────────────────┘  │
└───────────────────┼──────────────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  Postman / Client │
         │  localhost:8080   │
         └──────────────────┘
```

---

## ✅ Checklist de Verificación

Antes de probar en Postman, asegúrate que:

- [ ] `.env` existe y tiene valores correctos
- [ ] `docker-compose ps` muestra todos los servicios "Up"
- [ ] `curl http://localhost:8080/api/health` retorna `"status": "ok"`
- [ ] `curl http://localhost:3000/health` retorna `"status": "ok"`
- [ ] `curl http://localhost:3001/api/scraping/health` retorna `"status": "ok"`
- [ ] Postman collection importada con `BASE_URL=http://localhost:8080`

---

## 📚 Referencias

- **Colección Postman**: `SIMA_Scraper_Postman_Collection.json`
- **Guía Postman**: `POSTMAN_SETUP.md`
- **README principal**: `README.md`
- **Arquitectura modular**: `scraping-service/ARCHITECTURE.md`
