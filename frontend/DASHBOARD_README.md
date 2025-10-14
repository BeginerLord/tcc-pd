# Dashboard de Cursos

Dashboard completo para la gestión de cursos con integración a TanStack Query.

## 🏗️ Arquitectura

La implementación sigue el patrón establecido:

```
Service Layer → Hooks (TanStack Query) → Components → Page
```

### Flujo de Datos

```
coursesService.getCourses()
    ↓
useCourses() hook
    ↓
CoursesGrid component
    ↓
Dashboard page
```

## 📁 Archivos Creados

### Componentes

#### `course-card.tsx`

Tarjeta individual para mostrar información de un curso.

**Props:**

- `course: CourseInfo` - Datos del curso
- `onClick?: () => void` - Callback al hacer click

**Características:**

- Diseño consistente con login-form y register-form
- Efectos hover con transiciones suaves
- Iconos de Lucide React (BookOpen, GraduationCap)
- Muestra: nombre, shortname e ID del curso

#### `courses-grid.tsx`

Grid responsivo para mostrar múltiples cursos.

**Props:**

- `courses?: CourseInfo[]` - Array de cursos
- `isLoading?: boolean` - Estado de carga
- `isError?: boolean` - Estado de error
- `error?: Error | null` - Objeto de error
- `onRetry?: () => void` - Callback para reintentar
- `onCourseClick?: (course: CourseInfo) => void` - Callback al seleccionar curso

**Estados Manejados:**

- ✅ Loading - Spinner animado
- ✅ Error - Mensaje con botón de reintento
- ✅ Empty - Sin cursos disponibles
- ✅ Success - Grid responsivo de cursos

**Layout:**

- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: 3 columnas

### Página

#### `app/dashboard/page.tsx`

Página principal del dashboard.

**Características:**

1. **Header Sticky**

   - Logo y título
   - Botón Actualizar (refetch)
   - Botón Sincronizar SIMA
   - Botón Cerrar Sesión

2. **Card de Resumen**

   - Total de cursos
   - Estado del sistema
   - Última actualización

3. **Grid de Cursos**
   - Usa `useCourses()` hook
   - Manejo completo de estados (loading, error, success)
   - Integración con `useSyncCourses()` para sincronización

**Hooks Utilizados:**

```tsx
const { data, isLoading, isError, error, refetch } = useCourses();
const { syncCoursesFn, isPending } = useSyncCourses({ onSuccess, onError });
```

## 🎨 Estilos y Diseño

### Consistencia Visual

- Usa los mismos componentes UI que login/register
- Paleta de colores coherente
- Efectos hover y transiciones uniformes
- Diseño responsivo mobile-first

### Componentes UI Utilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- `Button` con variantes: default, outline, ghost
- Iconos de `lucide-react`
- Toasts de `sonner`

### Gradientes y Fondos

```css
bg-gradient-to-br from-background via-accent/5 to-secondary/5
```

## 🔄 Flujo de Datos Completo

### 1. Service Layer

```typescript
// frontend/src/services/courses.service.ts
async getCourses(): Promise<GetCoursesResponse> {
  const response = await simaApi.get<GetCoursesResponse>("/courses");
  return response.data; // { success, data: CourseInfo[], count }
}
```

### 2. Hook Layer

```typescript
// frontend/src/hooks/useCourses.ts
export function useCourses() {
  return useQuery({
    queryKey: coursesKeys.lists(),
    queryFn: () => coursesService.getCourses(),
  });
}
```

### 3. Component Layer

```typescript
// frontend/src/components/courses-grid.tsx
<CoursesGrid
  courses={coursesResponse?.data || []}
  isLoading={isLoading}
  isError={isError}
  error={error}
  onRetry={() => refetch()}
/>
```

### 4. Page Layer

```typescript
// frontend/src/app/dashboard/page.tsx
const { data: coursesResponse, isLoading, isError, error } = useCourses();
```

## 🚀 Funcionalidades

### ✅ Implementadas

1. **Listar Cursos**

   - GET `/api/courses`
   - Cache automático con TanStack Query
   - Revalidación al refetch

2. **Sincronizar desde SIMA**

   - POST `/api/courses/sync`
   - Prompt para credenciales
   - Invalidación automática del cache
   - Notificaciones de éxito/error

3. **Manejo de Estados**

   - Loading con spinner
   - Error con retry
   - Empty state
   - Success con grid

4. **Autenticación**
   - Logout que limpia sessionStorage
   - Redirección a /login

### 🔜 Mejoras Sugeridas

1. **Persistir credenciales SIMA**

   - Guardar en perfil de usuario (encriptadas)
   - Evitar pedir credenciales en cada sincronización

2. **Detalles de Curso**

   - Crear página `/dashboard/courses/[id]`
   - Mostrar horarios, actividades, etc.

3. **Búsqueda y Filtros**

   - Input de búsqueda
   - Filtros por semestre, estado, etc.

4. **Sincronización Automática**

   - Background sync cada X minutos
   - Indicador de última sincronización

5. **Vista de Calendario**
   - Integración con schedule
   - Vista semanal/mensual

## 📝 Uso

### Navegación al Dashboard

```tsx
// Desde login-form.tsx
router.push("/dashboard");
```

### URL del Dashboard

```
http://localhost:3000/dashboard
```

### Sincronizar Cursos

1. Click en "Sincronizar SIMA"
2. Ingresar usuario de SIMA
3. Ingresar contraseña de SIMA
4. Esperar confirmación

### Actualizar Lista

- Click en "Actualizar" para refetch manual
- O esperar revalidación automática (staleTime: 60s)

## 🧪 Testing Manual

1. **Sin cursos**

   - Verificar empty state
   - Mensaje "No hay cursos disponibles"

2. **Con cursos**

   - Verificar grid responsivo
   - Hover effects en cards
   - Click en cursos

3. **Sincronización**

   - Credenciales válidas → éxito
   - Credenciales inválidas → error
   - Cancelar prompt → warning

4. **Estados de error**
   - Desconectar red → error state
   - Click en "Reintentar"

## 🔗 Endpoints Backend Requeridos

```
GET  /api/courses
POST /api/courses/sync
GET  /api/courses/:id (opcional)
GET  /api/courses/search?q=query (opcional)
```

## 📦 Dependencias

Todas las dependencias ya están instaladas:

- `@tanstack/react-query` - State management
- `lucide-react` - Iconos
- `sonner` - Toasts
- `next` - Framework
- `axios` - HTTP client

## ✨ Características Destacadas

1. **Type Safety Completo**

   - Interfaces desde `@/models`
   - Props tipadas
   - Responses tipadas

2. **UX Optimizada**

   - Feedback inmediato
   - Estados de carga claros
   - Mensajes descriptivos

3. **Performance**

   - Cache inteligente
   - Revalidación automática
   - Lazy loading preparado

4. **Accesibilidad**

   - Semántica HTML correcta
   - ARIA labels preparados
   - Keyboard navigation

5. **Responsive Design**
   - Mobile first
   - Breakpoints consistentes
   - Grid adaptable
