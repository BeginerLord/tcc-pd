# API de Actividades de Cursos

Esta documentación describe los nuevos endpoints para gestionar las actividades de los cursos.

## Flujo de Trabajo

1. **Autenticarse** y obtener el token JWT
2. **Obtener cursos** del usuario (GET `/api/courses`)
3. **Sincronizar actividades** de un curso específico desde el scraping service
4. **Consultar actividades** almacenadas en la base de datos

## Endpoints del Main API

### 1. Sincronizar Actividades de un Curso

Guarda las actividades de un curso en la base de datos, relacionadas con el usuario y el curso.

**Endpoint:** `POST /api/courses/activities/sync`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**

```json
{
  "courseId": "2171",
  "courseName": "ARQUITECTURA DE SOFTWARE",
  "sections": [
    {
      "sectionNumber": 1,
      "sectionName": "UNIDAD 1",
      "activities": [
        {
          "activityId": "108138",
          "name": "Protocolo individual de la unidad 1",
          "type": "assign",
          "section": 1,
          "sectionName": "UNIDAD 1",
          "url": "https://sima.unicartagena.edu.co/mod/assign/view.php?id=108138",
          "dates": {
            "apertura": "sábado, 23 de agosto de 2025, 16:40",
            "cierre": "viernes, 5 de septiembre de 2025, 23:59"
          },
          "icon": "https://...",
          "description": "Descripción de la actividad"
        }
      ]
    }
  ],
  "totalActivities": 15
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Course activities synced successfully",
  "data": {
    "courseId": "2171",
    "courseName": "ARQUITECTURA DE SOFTWARE",
    "totalActivities": 15,
    "sectionsCount": 5,
    "lastSynced": "2025-10-21T12:00:00.000Z"
  }
}
```

### 2. Obtener Actividades de un Curso

Obtiene las actividades almacenadas de un curso específico.

**Endpoint:** `GET /api/courses/:courseId/activities`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "courseId": "2171",
    "courseName": "ARQUITECTURA DE SOFTWARE",
    "sections": [
      {
        "sectionNumber": 1,
        "sectionName": "UNIDAD 1",
        "activities": [...]
      }
    ],
    "totalActivities": 15,
    "lastSynced": "2025-10-21T12:00:00.000Z"
  }
}
```

### 3. Obtener Solo Actividades con Fechas

Obtiene únicamente las actividades que tienen fechas de apertura/cierre.

**Endpoint:** `GET /api/courses/:courseId/activities/dated`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "activityId": "108138",
      "name": "Protocolo individual de la unidad 1",
      "type": "assign",
      "section": 1,
      "sectionName": "UNIDAD 1",
      "url": "https://...",
      "dates": {
        "apertura": "sábado, 23 de agosto de 2025, 16:40",
        "cierre": "viernes, 5 de septiembre de 2025, 23:59"
      }
    }
  ],
  "count": 10,
  "courseId": "2171",
  "courseName": "ARQUITECTURA DE SOFTWARE"
}
```

## Flujo Completo de Ejemplo

### Paso 1: Login y obtener token

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario",
    "password": "contraseña"
  }'
```

Respuesta incluye el `token` JWT.

### Paso 2: Obtener cursos del usuario

```bash
curl -X GET http://localhost:4000/api/courses \
  -H "Authorization: Bearer <TOKEN>"
```

### Paso 3: Obtener actividades desde el scraping service

Este paso se hace internamente o a través del API Gateway. El scraping service devuelve:

```bash
curl -X POST http://localhost:3002/api/scraping/course/2171/activities \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": ["cookie1", "cookie2"]
  }'
```

### Paso 4: Sincronizar actividades en el main-api

```bash
curl -X POST http://localhost:4000/api/courses/activities/sync \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "2171",
    "courseName": "ARQUITECTURA DE SOFTWARE",
    "sections": [...],
    "totalActivities": 15
  }'
```

### Paso 5: Consultar actividades almacenadas

```bash
curl -X GET http://localhost:4000/api/courses/2171/activities \
  -H "Authorization: Bearer <TOKEN>"
```

## Modelo de Datos

### CourseSchedule (MongoDB)

```javascript
{
  _id: ObjectId,
  courseId: String,          // ID del curso en SIMA
  userId: ObjectId,          // Referencia al usuario
  courseName: String,        // Nombre del curso
  sections: [
    {
      sectionNumber: Number,
      sectionName: String,
      activities: [
        {
          activityId: String,
          name: String,
          type: String,
          section: Number,
          sectionName: String,
          url: String,
          dates: {
            apertura: String,
            cierre: String
          },
          icon: String,
          description: String
        }
      ]
    }
  ],
  totalActivities: Number,
  lastSynced: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Índices

- `{ userId: 1, courseId: 1 }` - Único: Un usuario solo puede tener un registro de actividades por curso
- `{ courseId: 1 }` - Para búsquedas por curso
- `{ userId: 1 }` - Para búsquedas por usuario

## Notas Importantes

1. **Relación Course-CourseSchedule**:

   - Un `Course` representa el curso básico del usuario
   - Un `CourseSchedule` contiene las actividades detalladas de ese curso
   - Ambos están relacionados por `courseId` y `userId`

2. **Sincronización**:

   - Las actividades se deben sincronizar periódicamente desde SIMA
   - La sincronización sobrescribe los datos anteriores
   - Se registra `lastSynced` para saber cuándo fue la última actualización

3. **Autenticación**:

   - Todos los endpoints requieren token JWT válido
   - El usuario solo puede ver sus propias actividades

4. **Tipos de Actividades**:
   - `assign`: Tareas
   - `quiz`: Evaluaciones/Cuestionarios
   - `forum`: Foros
   - `resource`: Recursos/Archivos
   - Otros tipos según SIMA
