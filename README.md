# SIMA Scraper - Arquitectura Distribuida

Sistema distribuido para scraping y gestión de horarios académicos del SIMA (Universidad de Cartagena).

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura de microservicios con los siguientes componentes:

```
┌─────────────────────────────────────────────────────┐
│                   API GATEWAY                        │
│                  (Puerto 8080)                       │
│  - Enrutamiento de solicitudes                      │
│  - Autenticación centralizada                       │
│  - Rate limiting y seguridad                        │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
       ┌───────▼────────┐  ┌─────▼──────────────┐
       │   MAIN API     │  │ SCRAPING SERVICE   │
       │  (Puerto 3000) │  │   (Puerto 3001)    │
       │                │  │                    │
       │ - Autenticación│  │ - Web Scraping     │
       │ - Base de datos│  │ - Extracción datos │
       │ - Lógica negocio│  │ - Sin BD          │
       └────────┬───────┘  └────────────────────┘
                │
         ┌──────▼──────┐
         │  MongoDB    │
         │(Puerto 27017)│
         └─────────────┘
```

## 📦 Servicios

### 1. API Gateway (`/api-gateway`)
- **Puerto:** 8080
- **Responsabilidades:**
  - Punto de entrada único para todas las solicitudes
  - Enrutamiento inteligente entre servicios
  - Middleware de autenticación
  - Rate limiting y CORS
  - Monitoreo de salud de servicios

### 2. Main API (`/main-api`)
- **Puerto:** 3000
- **Responsabilidades:**
  - Gestión de usuarios y autenticación (JWT)
  - Almacenamiento de credenciales encriptadas
  - CRUD de cursos y horarios
  - Gestión de sesiones SIMA
  - Conexión a MongoDB

### 3. Scraping Service (`/scraping-service`)
- **Puerto:** 3001
- **Responsabilidades:**
  - Scraping de SIMA (cursos, horarios, eventos)
  - Parsing de HTML con Cheerio
  - Extracción de datos de calendario
  - Servicio stateless (sin base de datos)

## 🚀 Instalación y Configuración

### Opción 1: Docker Compose (Recomendado)

1. **Clonar y configurar:**
```bash
cd proyectos
cp .env.example .env
# Editar .env con tus configuraciones
```

2. **Iniciar todos los servicios:**
```bash
docker-compose up -d
```

3. **Verificar estado:**
```bash
docker-compose ps
curl http://localhost:8080/api/health
```

### Opción 2: Desarrollo Local

#### Requisitos previos:
- Node.js 20+
- MongoDB instalado y corriendo
- npm o pnpm

#### 1. Main API
```bash
cd main-api
npm install
cp .env.example .env
# Configurar MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY
npm run dev
```

#### 2. Scraping Service
```bash
cd scraping-service
npm install
cp .env.example .env
# Configurar SCRAPING_PORT, SIMA_BASE_URL
npm run dev
```

#### 3. API Gateway
```bash
cd api-gateway
npm install
cp .env.example .env
# Configurar MAIN_API_URL, SCRAPING_SERVICE_URL
npm run dev
```

## 📖 Uso de la API

Todas las peticiones se hacen al **API Gateway** en el puerto **8080**.

### Autenticación

#### Registro
```bash
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "usuario",
  "password": "password123",
  "simaUsername": "usuario.sima",
  "simaPassword": "password_sima"
}
```

#### Login
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "usuario",
  "password": "password123"
}
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "usuario"
  }
}
```

### Cursos

#### Listar cursos (desde BD)
```bash
GET http://localhost:8080/api/courses
Authorization: Bearer {token}
```

#### Sincronizar cursos desde SIMA
```bash
POST http://localhost:8080/api/courses/sync
Authorization: Bearer {token}
```
Este endpoint:
1. Obtiene las cookies del usuario autenticado
2. Llama al scraping-service para obtener cursos
3. Guarda los cursos en la base de datos

### Horarios

#### Obtener horario por período
```bash
GET http://localhost:8080/api/schedule/day
GET http://localhost:8080/api/schedule/week
GET http://localhost:8080/api/schedule/month
GET http://localhost:8080/api/schedule/upcoming
Authorization: Bearer {token}
```

#### Eventos próximos de un curso
```bash
GET http://localhost:8080/api/schedule/upcoming/{courseId}
Authorization: Bearer {token}
```

#### Historial de horarios
```bash
GET http://localhost:8080/api/schedule/history/7
Authorization: Bearer {token}
```

#### Limpiar caché
```bash
DELETE http://localhost:8080/api/schedule/cache
Authorization: Bearer {token}
```

## 🔧 Variables de Entorno

### API Gateway
```env
GATEWAY_PORT=8080
MAIN_API_URL=http://localhost:3000
SCRAPING_SERVICE_URL=http://localhost:3001
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
```

### Main API
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sima-scraper
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-char-key
```

### Scraping Service
```env
SCRAPING_PORT=3001
SIMA_BASE_URL=https://sima.unicartagena.edu.co
```

## 🏥 Health Checks

- **Gateway:** `GET http://localhost:8080/api/health`
- **Main API:** `GET http://localhost:3000/health`
- **Scraping Service:** `GET http://localhost:3001/api/scraping/health`

## 🔒 Seguridad

- **JWT:** Autenticación basada en tokens
- **Bcrypt:** Hashing de passwords
- **Encriptación AES-256:** Para credenciales SIMA
- **Rate Limiting:** Protección contra ataques de fuerza bruta
- **Helmet:** Headers de seguridad HTTP
- **CORS:** Control de acceso entre dominios

## 📊 Ventajas de esta Arquitectura

1. **Escalabilidad:** Cada servicio puede escalarse independientemente
2. **Mantenibilidad:** Código separado por responsabilidades
3. **Resiliencia:** Un servicio caído no afecta a los demás
4. **Desarrollo independiente:** Equipos pueden trabajar en paralelo
5. **Tecnología flexible:** Cada servicio puede usar diferentes tecnologías
6. **Testing más fácil:** Servicios pequeños y enfocados

## 🛠️ Scripts Disponibles

Cada servicio tiene los siguientes scripts:

- `npm run dev` - Modo desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar versión compilada
- `npm run lint` - Linting con ESLint
- `npm run typecheck` - Verificar tipos TypeScript

## 📝 Notas Adicionales

- El **Gateway** maneja la autenticación y valida tokens antes de enrutar
- El **Scraping Service** es stateless y no almacena datos
- Las **cookies de SIMA** se gestionan y renuevan automáticamente
- Los **cursos** se sincronizan bajo demanda desde SIMA

## 🤝 Contribución

Para contribuir al proyecto:
1. Crea una rama para tu feature
2. Desarrolla y prueba localmente
3. Asegúrate de que todos los servicios funcionan correctamente
4. Crea un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso académico.
