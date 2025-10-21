# Course Activities API

Este documento describe los nuevos endpoints para obtener las actividades de los cursos.

## Endpoints

### 1. Obtener actividades de un curso específico

Obtiene todas las actividades de un curso organizadas por secciones.

**Endpoint:** `POST /api/scraping/course/:courseId/activities`

**Parámetros:**

- `courseId` (path parameter): ID del curso (ej: "2171")

**Body:**

```json
{
  "cookies": ["cookie1", "cookie2", ...]
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": {
    "courseId": "2171",
    "courseName": "INGENIERÍA DE SOFTWARE - CERETÉ - ARQUITECTURA DE SOFTWARE - C1 - 2025 - 2",
    "sections": [
      {
        "sectionNumber": 1,
        "sectionName": "UNIDAD 1",
        "activities": [
          {
            "id": "108138",
            "name": "Protocolo individual de la unidad 1",
            "type": "assign",
            "section": 1,
            "sectionName": "UNIDAD 1",
            "url": "https://sima.unicartagena.edu.co/mod/assign/view.php?id=108138",
            "icon": "https://sima.unicartagena.edu.co/theme/image.php/remui/assign/1760202390/monologo?filtericon=1",
            "dates": {
              "apertura": "sábado, 23 de agosto de 2025, 16:40",
              "cierre": "viernes, 5 de septiembre de 2025, 23:59"
            }
          },
          {
            "id": "108139",
            "name": "Protocolo colaborativo de la unidad 1",
            "type": "assign",
            "section": 1,
            "sectionName": "UNIDAD 1",
            "url": "https://sima.unicartagena.edu.co/mod/assign/view.php?id=108139",
            "dates": {
              "apertura": "sábado, 23 de agosto de 2025, 16:41",
              "cierre": "viernes, 5 de septiembre de 2025, 23:59"
            }
          },
          {
            "id": "108141",
            "name": "Evaluación de la unidad 1",
            "type": "quiz",
            "section": 1,
            "sectionName": "UNIDAD 1",
            "url": "https://sima.unicartagena.edu.co/mod/quiz/view.php?id=108141",
            "dates": {
              "apertura": "sábado, 30 de agosto de 2025, 08:00",
              "cierre": "viernes, 5 de septiembre de 2025, 23:59"
            }
          }
        ]
      },
      {
        "sectionNumber": 2,
        "sectionName": "UNIDAD 2",
        "activities": [...]
      }
    ],
    "totalActivities": 15,
    "lastUpdated": "2025-10-21T12:00:00.000Z"
  }
}
```

### 2. Obtener actividades de múltiples cursos

Obtiene las actividades de varios cursos en una sola petición.

**Endpoint:** `POST /api/scraping/courses/activities`

**Body:**

```json
{
  "cookies": ["cookie1", "cookie2", ...],
  "courseIds": ["2171", "2172", "2173"]
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": [
    {
      "courseId": "2171",
      "courseName": "ARQUITECTURA DE SOFTWARE",
      "sections": [...],
      "totalActivities": 15,
      "lastUpdated": "2025-10-21T12:00:00.000Z"
    },
    {
      "courseId": "2172",
      "courseName": "INGENIERIA ECONOMICA",
      "sections": [...],
      "totalActivities": 12,
      "lastUpdated": "2025-10-21T12:00:00.000Z"
    }
  ],
  "count": 2
}
```

### 3. Obtener solo actividades con fechas

Obtiene únicamente las actividades que tienen fechas de apertura/cierre (tareas, evaluaciones, etc.).

**Endpoint:** `POST /api/scraping/course/:courseId/activities/dated`

**Parámetros:**

- `courseId` (path parameter): ID del curso

**Body:**

```json
{
  "cookies": ["cookie1", "cookie2", ...]
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": [
    {
      "id": "108138",
      "name": "Protocolo individual de la unidad 1",
      "type": "assign",
      "section": 1,
      "sectionName": "UNIDAD 1",
      "url": "https://sima.unicartagena.edu.co/mod/assign/view.php?id=108138",
      "dates": {
        "apertura": "sábado, 23 de agosto de 2025, 16:40",
        "cierre": "viernes, 5 de septiembre de 2025, 23:59"
      }
    }
  ],
  "count": 10,
  "courseId": "2171"
}
```

## Tipos de Actividades

El campo `type` puede tener los siguientes valores:

- `assign`: Tarea/Asignación
- `quiz`: Cuestionario/Evaluación
- `forum`: Foro
- `resource`: Recurso/Archivo
- `url`: Enlace externo
- `page`: Página de contenido
- `folder`: Carpeta
- `label`: Etiqueta/Título (generalmente filtradas)

## Estructura de Datos

### CourseActivity

```typescript
{
  id: string;              // ID de la actividad (module ID)
  name: string;            // Nombre de la actividad
  type: string;            // Tipo de actividad
  section: number;         // Número de sección
  sectionName?: string;    // Nombre de la sección
  url?: string;            // URL de la actividad
  dates?: {
    apertura?: string;     // Fecha de apertura
    cierre?: string;       // Fecha de cierre
  };
  icon?: string;           // URL del icono
  description?: string;    // Descripción (si está disponible)
}
```

### CourseSchedule

```typescript
{
  courseId: string;                 // ID del curso
  courseName?: string;              // Nombre del curso
  sections: CourseSection[];        // Secciones con actividades
  totalActivities: number;          // Total de actividades
  lastUpdated: string;              // Última actualización (ISO string)
}
```

## Ejemplo de uso con Postman/cURL

### Obtener actividades de un curso

```bash
curl -X POST http://localhost:3002/api/scraping/course/2171/activities \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": ["MoodleSession=abc123", "MOODLEID1_=def456"]
  }'
```

### Obtener actividades de varios cursos

```bash
curl -X POST http://localhost:3002/api/scraping/courses/activities \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": ["MoodleSession=abc123"],
    "courseIds": ["2171", "2172", "2173"]
  }'
```

## Notas

- Las cookies deben ser válidas y pertenecer a una sesión activa en SIMA
- El servicio automáticamente filtra actividades tipo `label` ya que son solo títulos/separadores
- Las fechas se devuelven en formato español tal como aparecen en SIMA
- Si una sección no tiene actividades, no se incluye en la respuesta
