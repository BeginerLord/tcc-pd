# 🏗️ Arquitectura Modular - Scraping Service

## 📊 Estructura de Archivos

```
scraping-service/
└── src/
    ├── services/
    │   ├── scraperService.ts          # 🎯 Orquestador Principal
    │   │
    │   ├── modules/                   # 📦 Servicios Modulares
    │   │   ├── sessionService.ts      # 🔑 Gestión de sesiones
    │   │   ├── coursesService.ts      # 📚 Obtención de cursos
    │   │   ├── calendarService.ts     # 📅 Eventos del calendario
    │   │   ├── activitiesService.ts   # 📝 Fechas de actividades
    │   │   └── index.ts               # 📤 Exportaciones
    │   │
    │   ├── helpers/                   # 🛠️ Utilidades Compartidas
    │   │   ├── cookieParser.ts        # 🍪 Parser de cookies
    │   │   ├── timeParser.ts          # ⏰ Conversión de tiempos
    │   │   ├── eventTypeDetector.ts   # 🔍 Detección de tipos
    │   │   └── index.ts               # 📤 Exportaciones
    │   │
    │   └── README.md                  # 📖 Documentación
    │
    ├── routes/
    │   └── scraping.ts                # 🛣️ Rutas API
    │
    ├── types/
    │   └── index.ts                   # 📋 Tipos TypeScript
    │
    └── index.ts                       # 🚀 Entry point
```

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                 │
│                   (Puerto 8080)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Scraping Service                               │
│                   (Puerto 3001)                                  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              routes/scraping.ts                         │    │
│  │  • POST /courses                                        │    │
│  │  • POST /schedule/:period                              │    │
│  │  • POST /upcoming/:courseId                            │    │
│  │  • GET  /health                                        │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                        │
│                         ▼                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         scraperService.ts (Orquestador)                │    │
│  │                                                         │    │
│  │  • getUserCourses()                                    │    │
│  │  • getCalendarEvents()                                 │    │
│  │  • getUpcomingEvents()                                 │    │
│  │  • scrapeSchedule()                                    │    │
│  │  • enhanceEventsWithActivityDates()                   │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                        │
│        ┌────────────────┼────────────────┬──────────────┐      │
│        ▼                ▼                ▼              ▼       │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐│
│  │ Session  │  │   Courses    │  │  Calendar  │  │Activities││
│  │ Service  │  │   Service    │  │  Service   │  │ Service  ││
│  └──────────┘  └──────────────┘  └────────────┘  └──────────┘│
│       │               │                 │              │       │
│       └───────────────┴─────────────────┴──────────────┘       │
│                              │                                  │
│                              ▼                                  │
│                  ┌────────────────────┐                        │
│                  │     Helpers        │                        │
│                  │ • CookieParser     │                        │
│                  │ • TimeParser       │                        │
│                  │ • EventTypeDetector│                        │
│                  └────────────────────┘                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │       SIMA       │
                    │  (sima.uni...)   │
                    └──────────────────┘
```

## 🎯 Responsabilidades por Módulo

### 1. SessionService
```typescript
Responsabilidad: Gestión de sesiones SIMA
├── getSessionKey()
│   └── Extrae sesskey para peticiones AJAX
└── Dependencias: CookieParser
```

### 2. CoursesService
```typescript
Responsabilidad: Obtención de cursos
├── getUserCourses()
│   ├── Prueba múltiples URLs
│   ├── Valida autenticación
│   └── Parsea HTML de cursos
└── Dependencias: CookieParser
```

### 3. CalendarService
```typescript
Responsabilidad: Eventos del calendario
├── getCalendarEvents()
│   ├── Vista: day | month | upcoming
│   ├── Parsea HTML del calendario
│   └── Detecta tipos de eventos
├── getUpcomingEvents()
│   ├── Usa API AJAX de Moodle
│   └── Retorna JSON estructurado
└── Dependencias:
    ├── SessionService
    ├── CookieParser
    ├── TimeParser
    └── EventTypeDetector
```

### 4. ActivitiesService
```typescript
Responsabilidad: Fechas de actividades
├── getActivityDates()
│   ├── Extrae fechas apertura/cierre
│   ├── Maneja URLs de asignaciones
│   └── Parsea [data-region="activity-dates"]
├── enhanceEventsWithActivityDates()
│   ├── Enriquece eventos con fechas
│   └── Solo para assignments/evaluaciones
├── convertEventsToSchedule()
│   ├── Agrupa eventos por fecha
│   └── Ordena cronológicamente
└── Dependencias: CookieParser
```

## 📝 Ejemplo de Llamada Completa

```typescript
// Cliente hace petición
POST /api/scraping/schedule/week
Body: { cookies: [...], courseId: "123" }

↓

// scraperService.scrapeSchedule()
1. Llama a calendarService.getCalendarEvents()
   ├── Usa cookieParser.parseCookies()
   ├── Hace petición HTTP a SIMA
   └── Usa timeParser y eventTypeDetector

2. Llama a activitiesService.enhanceEventsWithActivityDates()
   ├── Para cada evento tipo 'assignment'
   │   └── activitiesService.getActivityDates(url)
   │       ├── Construye URL con action=editsubmission
   │       ├── Hace petición HTTP
   │       └── Parsea [data-region="activity-dates"]
   └── Retorna eventos enriquecidos

3. Llama a activitiesService.convertEventsToSchedule()
   ├── Agrupa eventos por fecha
   └── Ordena actividades

↓

// Retorna al cliente
{
  success: true,
  data: [
    {
      date: "2025-10-06",
      activities: [
        {
          id: "123",
          title: "Protocolo individual de la unidad 2",
          startTime: "15:23",
          type: "assignment",
          activityDates: {
            apertura: "lunes, 18 de agosto de 2025, 15:23",
            cierre: "sábado, 11 de octubre de 2025, 15:23"
          }
        }
      ]
    }
  ]
}
```

## 🚀 Ventajas de Esta Arquitectura

### ✅ Separación de Responsabilidades
Cada módulo tiene una única responsabilidad bien definida.

### ✅ Escalabilidad
Agregar nuevas funcionalidades es sencillo:
- Crear nuevo servicio en `modules/`
- Integrarlo en el orquestador
- No afecta código existente

### ✅ Mantenibilidad
- Código más legible y organizado
- Fácil ubicar bugs (responsabilidad clara)
- Helpers reutilizables

### ✅ Testabilidad
- Cada módulo se puede testear independientemente
- Mocking simplificado
- Tests más enfocados

### ✅ Retrocompatibilidad
- El API público no cambia
- scraperService.ts mantiene la misma interfaz
- Las rutas existentes siguen funcionando

## 🔧 Cómo Extender

### Agregar nuevo servicio modular

1. **Crear archivo en `modules/`**
```typescript
// modules/notificationsService.ts
export class NotificationsService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SIMA_BASE_URL;
  }

  async getNotifications(cookies: string[]) {
    // Implementación
  }
}
```

2. **Exportar en `modules/index.ts`**
```typescript
export { NotificationsService } from './notificationsService';
```

3. **Integrar en orquestador**
```typescript
// scraperService.ts
import { NotificationsService } from './modules';

export class ScraperService {
  private notificationsService: NotificationsService;

  constructor() {
    this.notificationsService = new NotificationsService(this.baseUrl);
  }

  async getNotifications(cookies: string[]) {
    return this.notificationsService.getNotifications(cookies);
  }
}
```

4. **Agregar ruta**
```typescript
// routes/scraping.ts
fastify.post('/notifications', async (request, reply) => {
  const { cookies } = request.body;
  const notifications = await scraperService.getNotifications(cookies);
  return reply.send({ success: true, data: notifications });
});
```

### Agregar nueva utilidad helper

```typescript
// helpers/urlBuilder.ts
export class UrlBuilder {
  static buildActivityUrl(activityId: string, action?: string): string {
    let url = `https://sima.unicartagena.edu.co/mod/assign/view.php?id=${activityId}`;
    if (action) url += `&action=${action}`;
    return url;
  }
}
```

## 📚 Referencias

- **Patrón de diseño:** Orchestrator + Service Layer
- **Principios SOLID:** Single Responsibility, Open/Closed
- **Documentación completa:** Ver `services/README.md`
