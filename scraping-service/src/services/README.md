# Servicios de Scraping - Arquitectura Modular

Esta carpeta contiene la arquitectura modular del servicio de scraping de SIMA, diseñada para ser escalable y mantenible.

## 📁 Estructura

```
services/
├── scraperService.ts          # Orquestador principal (mantiene compatibilidad)
├── modules/                   # Servicios modulares especializados
│   ├── sessionService.ts     # Manejo de sesiones y sesskeys
│   ├── coursesService.ts     # Obtención de cursos
│   ├── calendarService.ts    # Eventos del calendario
│   ├── activitiesService.ts  # Fechas de actividades específicas
│   └── index.ts              # Exportaciones
└── helpers/                   # Utilidades compartidas
    ├── cookieParser.ts       # Parser de cookies
    ├── timeParser.ts         # Conversión de tiempos
    ├── eventTypeDetector.ts  # Detección de tipos de eventos
    └── index.ts              # Exportaciones
```

## 🔧 Servicios Modulares

### 1. SessionService (`modules/sessionService.ts`)
**Responsabilidad:** Manejo de sesiones SIMA

**Métodos:**
- `getSessionKey(cookies: string[]): Promise<string>`
  - Obtiene el sesskey necesario para peticiones AJAX

**Ejemplo:**
```typescript
import { SessionService } from './modules/sessionService';

const sessionService = new SessionService();
const sesskey = await sessionService.getSessionKey(cookies);
```

---

### 2. CoursesService (`modules/coursesService.ts`)
**Responsabilidad:** Obtención de cursos del usuario

**Métodos:**
- `getUserCourses(cookies: string[]): Promise<CourseInfo[]>`
  - Extrae todos los cursos del usuario autenticado
  - Prueba múltiples URLs para máxima compatibilidad
  - Valida que no se redirija al login

**Ejemplo:**
```typescript
import { CoursesService } from './modules/coursesService';

const coursesService = new CoursesService();
const courses = await coursesService.getUserCourses(cookies);
```

---

### 3. CalendarService (`modules/calendarService.ts`)
**Responsabilidad:** Extracción de eventos del calendario

**Métodos:**
- `getCalendarEvents(cookies, view, courseId?, date?): Promise<CalendarEvent[]>`
  - Obtiene eventos según vista (day, month, upcoming)
  - Soporta filtrado por curso
  - Parsea HTML del calendario

- `getUpcomingEvents(cookies, courseId): Promise<CalendarEvent[]>`
  - Obtiene eventos próximos via API AJAX de Moodle
  - Retorna JSON estructurado

**Ejemplo:**
```typescript
import { CalendarService } from './modules/calendarService';

const calendarService = new CalendarService();
const events = await calendarService.getCalendarEvents(cookies, 'month');
const upcoming = await calendarService.getUpcomingEvents(cookies, '123');
```

---

### 4. ActivitiesService (`modules/activitiesService.ts`)
**Responsabilidad:** Manejo de actividades específicas

**Métodos:**
- `getActivityDates(cookies, activityUrl): Promise<{ apertura?, cierre? }>`
  - Extrae fechas de apertura/cierre de actividades
  - Maneja URLs de asignaciones automáticamente
  - Parsea bloques `[data-region="activity-dates"]`

- `enhanceEventsWithActivityDates(cookies, events): Promise<CalendarEvent[]>`
  - Enriquece eventos con fechas de apertura/cierre
  - Solo para asignaciones y evaluaciones

- `convertEventsToSchedule(events): ScheduleData[]`
  - Convierte eventos a formato de horario estructurado
  - Agrupa por fecha y ordena

**Ejemplo:**
```typescript
import { ActivitiesService } from './modules/activitiesService';

const activitiesService = new ActivitiesService();
const dates = await activitiesService.getActivityDates(cookies, activityUrl);
const enhanced = await activitiesService.enhanceEventsWithActivityDates(cookies, events);
```

---

## 🛠️ Helpers (Utilidades)

### 1. CookieParser (`helpers/cookieParser.ts`)
**Utilidad:** Parseo de cookies

**Métodos estáticos:**
- `parseCookies(cookies: string[]): string`
  - Convierte array de cookies a header string
  - Elimina duplicados
  - Formato válido para HTTP headers

---

### 2. TimeParser (`helpers/timeParser.ts`)
**Utilidad:** Conversión de tiempos

**Métodos estáticos:**
- `parseTimeToTimestamp(timeText: string): number`
  - Convierte texto de hora (ej: "14:30") a timestamp UNIX
  - Maneja errores de parsing

---

### 3. EventTypeDetector (`helpers/eventTypeDetector.ts`)
**Utilidad:** Detección de tipos de eventos

**Métodos estáticos:**
- `determineEventType(classNames: string, title: string): string`
  - Detecta tipo de evento (assignment, quiz, forum, lesson)
  - Usa clases CSS y título para determinar
  - Retorna tipo genérico si no coincide

---

## 🎯 ScraperService (Orquestador)

El `scraperService.ts` principal actúa como **orquestador** que:
- Mantiene compatibilidad con la API existente
- Inicializa y coordina todos los módulos
- Delega responsabilidades a servicios especializados
- No contiene lógica de negocio, solo orquestación

**Ventajas:**
✅ Código más limpio y mantenible
✅ Responsabilidades bien definidas
✅ Fácil de testear (cada módulo independiente)
✅ Escalable (agregar nuevos módulos sin afectar existentes)
✅ Retrocompatible (mismo API público)

---

## 📝 Ejemplo de Uso Completo

```typescript
// Importar el servicio principal
import { ScraperService } from './services/scraperService';

const scraper = new ScraperService();

// Obtener cursos
const courses = await scraper.getUserCourses(cookies);

// Obtener eventos del calendario
const events = await scraper.getCalendarEvents(cookies, 'month', '123');

// Obtener horario completo con fechas de actividades
const schedule = await scraper.scrapeSchedule(cookies, 'week', '123');

// Usar servicios modulares directamente (uso avanzado)
import { ActivitiesService } from './services/modules';

const activitiesService = new ActivitiesService();
const dates = await activitiesService.getActivityDates(cookies, url);
```

---

## 🚀 Agregar Nuevos Módulos

Para agregar un nuevo servicio modular:

1. **Crear archivo en `modules/`**
```typescript
// modules/newService.ts
export class NewService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SIMA_BASE_URL || 'https://sima.unicartagena.edu.co';
  }

  async newMethod() {
    // Implementación
  }
}
```

2. **Exportar en `modules/index.ts`**
```typescript
export { NewService } from './newService';
```

3. **Integrar en `scraperService.ts`**
```typescript
import { NewService } from './modules';

export class ScraperService {
  private newService: NewService;

  constructor() {
    this.newService = new NewService(this.baseUrl);
  }

  async newMethod() {
    return this.newService.newMethod();
  }
}
```

---

## 🧪 Testing

Cada módulo puede ser testeado independientemente:

```typescript
import { CoursesService } from './modules/coursesService';

describe('CoursesService', () => {
  it('should fetch user courses', async () => {
    const service = new CoursesService();
    const courses = await service.getUserCourses(mockCookies);
    expect(courses).toHaveLength(3);
  });
});
```

---

## 📊 Flujo de Datos

```
Cliente (API Request)
    ↓
scraperService.ts (Orquestador)
    ↓
┌─────────────┬──────────────┬─────────────────┬──────────────────┐
│ Session     │ Courses      │ Calendar        │ Activities       │
│ Service     │ Service      │ Service         │ Service          │
└─────────────┴──────────────┴─────────────────┴──────────────────┘
    ↓               ↓               ↓                   ↓
┌──────────────────────────────────────────────────────────────────┐
│                        Helpers                                    │
│  CookieParser | TimeParser | EventTypeDetector                   │
└──────────────────────────────────────────────────────────────────┘
    ↓
SIMA (sima.unicartagena.edu.co)
```
