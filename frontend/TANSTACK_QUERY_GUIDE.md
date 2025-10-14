# Guía de Uso - TanStack Query Hooks

## 📦 Instalación

```bash
npm install @tanstack/react-query
```

## 🚀 Configuración

La app ya está envuelta con el `QueryProvider` en `app/layout.tsx`:

```tsx
<QueryProvider>{children}</QueryProvider>
```

## 📚 Hooks Disponibles

### 🔐 1. Autenticación (useAuth)

#### Login
```tsx
import { useLogin } from "@/hooks";

function LoginForm() {
  const { loginFn, isPending, isError, error } = useLogin({
    onSuccess: (data) => {
      console.log("Bienvenido:", data.user.username);
      // Redirigir al dashboard
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleLogin = () => {
    loginFn({ username: "Nilson", password: "Akaza1999$" });
  };

  return (
    <button onClick={handleLogin} disabled={isPending}>
      {isPending ? "Iniciando sesión..." : "Login"}
    </button>
  );
}
```

#### Registro
```tsx
import { useRegister } from "@/hooks";

function RegisterForm() {
  const { registerFn, isPending } = useRegister({
    onSuccess: (data) => {
      alert("¡Registro exitoso!");
    }
  });

  const handleRegister = () => {
    registerFn({
      username: "Nilson",
      password: "Akaza1999$",
      simaUsername: "1003027895",
      simaPassword: "Akaza1999$"
    });
  };

  return (
    <button onClick={handleRegister} disabled={isPending}>
      {isPending ? "Registrando..." : "Registrar"}
    </button>
  );
}
```

#### Hook completo (backward compatible)
```tsx
import { useAuth } from "@/hooks";

function Dashboard() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>No autenticado</div>;
  }

  return (
    <div>
      <h1>Bienvenido {user?.username}</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

### 📚 2. Cursos (useCourses)

#### Obtener todos los cursos
```tsx
import { useCourses } from "@/hooks";

function CoursesList() {
  const { data: courses, isLoading, error } = useCourses();

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {courses?.map((course) => (
        <li key={course.id}>{course.name}</li>
      ))}
    </ul>
  );
}
```

#### Obtener un curso específico
```tsx
import { useCourse } from "@/hooks";

function CourseDetail({ courseId }: { courseId: string }) {
  const { data: course, isLoading } = useCourse(courseId);

  if (isLoading) return <div>Cargando...</div>;

  return <div>{course?.name}</div>;
}
```

#### Sincronizar cursos desde SIMA
```tsx
import { useSyncCourses } from "@/hooks";

function SyncButton() {
  const { syncCoursesFn, isPending, data } = useSyncCourses({
    onSuccess: (data) => {
      console.log("Cursos sincronizados:", data.courses.length);
      alert("¡Sincronización exitosa!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSync = () => {
    syncCoursesFn({ username: "user", password: "pass" });
  };

  return (
    <button onClick={handleSync} disabled={isPending}>
      {isPending ? "Sincronizando..." : "Sincronizar Cursos"}
    </button>
  );
}
```

#### Buscar cursos
```tsx
import { useSearchCourses } from "@/hooks";
import { useState } from "react";

function SearchCourses() {
  const [query, setQuery] = useState("");
  const { data: courses, isLoading } = useSearchCourses(query);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar curso..."
      />
      {isLoading && <p>Buscando...</p>}
      {courses?.map((course) => (
        <div key={course.id}>{course.name}</div>
      ))}
    </div>
  );
}
```

### 📅 3. Horarios (useSchedule)

#### Obtener historial
```tsx
import { useScheduleHistory } from "@/hooks";

function ScheduleHistory() {
  const { data: history, isLoading } = useScheduleHistory(7); // últimos 7 días

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {history?.map((item) => (
        <div key={item.date}>
          <h3>{item.date}</h3>
          {item.events.map((event) => (
            <p key={event.id}>{event.title}</p>
          ))}
        </div>
      ))}
    </div>
  );
}
```

#### Obtener eventos
```tsx
import { useScheduleEvents } from "@/hooks";

function CalendarView() {
  const { data: events, isLoading } = useScheduleEvents(
    "2025-01-01",
    "2025-01-31"
  );

  if (isLoading) return <div>Cargando eventos...</div>;

  return (
    <div>
      {events?.map((event) => (
        <div key={event.id}>
          <h4>{event.title}</h4>
          <p>{event.start} - {event.end}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Limpiar caché
```tsx
import { useClearScheduleCache } from "@/hooks";

function ClearCacheButton() {
  const { clearCacheFn, isPending } = useClearScheduleCache({
    onSuccess: () => {
      alert("Caché limpiado exitosamente");
    }
  });

  return (
    <button onClick={() => clearCacheFn()} disabled={isPending}>
      {isPending ? "Limpiando..." : "Limpiar Caché"}
    </button>
  );
}
```

### 🔍 4. Scraping (useScraping)

#### Login en SIMA
```tsx
import { useSimaLogin } from "@/hooks";

function SimaLoginButton() {
  const { simaLoginFn, isPending, data } = useSimaLogin({
    onSuccess: (session) => {
      console.log("Session ID:", session.sessionId);
    }
  });

  const handleLogin = () => {
    simaLoginFn({ username: "1003027895", password: "Akaza1999$" });
  };

  return (
    <button onClick={handleLogin} disabled={isPending}>
      {isPending ? "Conectando..." : "Login SIMA"}
    </button>
  );
}
```

#### Scraping de cursos
```tsx
import { useScrapeCourses } from "@/hooks";

function ScrapeCourses() {
  const { scrapeCoursesFn, isPending, data } = useScrapeCourses({
    onSuccess: (response) => {
      console.log("Cursos:", response.data);
    }
  });

  const handleScrape = () => {
    scrapeCoursesFn({ username: "1003027895", password: "Akaza1999$" });
  };

  return (
    <button onClick={handleScrape} disabled={isPending}>
      {isPending ? "Obteniendo..." : "Obtener Cursos"}
    </button>
  );
}
```

#### Scraping completo
```tsx
import { useScrapeAll } from "@/hooks";

function ScrapeAllButton() {
  const { scrapeAllFn, isPending, data } = useScrapeAll({
    onSuccess: (data) => {
      console.log("Cursos:", data.courses);
      console.log("Calendario:", data.calendar);
      console.log("Actividades:", data.activities);
      alert("¡Datos obtenidos!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleScrapeAll = () => {
    scrapeAllFn({ username: "1003027895", password: "Akaza1999$" });
  };

  return (
    <button onClick={handleScrapeAll} disabled={isPending}>
      {isPending ? "Obteniendo datos..." : "Scrape Todo"}
    </button>
  );
}
```

## 🎯 Ventajas de TanStack Query

1. **Cache automático** - Los datos se cachean automáticamente
2. **Refetch inteligente** - Re-fetching automático cuando es necesario
3. **Loading/Error states** - Estados manejados automáticamente
4. **Invalidación de cache** - Fácil invalidación después de mutaciones
5. **Callbacks opcionales** - onSuccess/onError personalizables
6. **TypeScript completo** - Tipos exportados para cada hook

## 📋 Propiedades útiles

### Para Queries (useQuery)
- `data` - Datos de la query
- `isLoading` - Si está cargando (primera vez)
- `isFetching` - Si está fetching (incluye refetch)
- `error` - Error si lo hay
- `refetch()` - Función para refetch manual
- `isSuccess` - Si fue exitosa
- `isError` - Si hubo error

### Para Mutations (useMutation)
- `mutate()` - Función para ejecutar la mutación (con nombre personalizado como `loginFn`)
- `mutateAsync()` - Versión async de mutate (como `loginAsync`)
- `isPending` - Si está en proceso
- `isSuccess` - Si fue exitosa
- `isError` - Si hubo error
- `data` - Datos de la respuesta
- `error` - Error si lo hay

## 🔄 Invalidación de Cache

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { coursesKeys } from "@/hooks";

function MyComponent() {
  const queryClient = useQueryClient();

  const invalidateCourses = () => {
    // Invalidar todas las queries de cursos
    queryClient.invalidateQueries({ queryKey: coursesKeys.all });
  };

  return <button onClick={invalidateCourses}>Invalidar Cache</button>;
}
```

## 🎨 Ejemplo Completo

```tsx
"use client";

import { useCourses, useSyncCourses } from "@/hooks";

export default function CoursesPage() {
  const { data: courses, isLoading, error } = useCourses();
  const { syncCoursesFn, isPending } = useSyncCourses({
    onSuccess: () => {
      alert("¡Cursos sincronizados!");
    },
    onError: (err) => {
      alert("Error al sincronizar");
    }
  });

  const handleSync = () => {
    syncCoursesFn({ username: "user", password: "pass" });
  };

  if (isLoading) return <div>Cargando cursos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Mis Cursos</h1>
      <button onClick={handleSync} disabled={isPending}>
        {isPending ? "Sincronizando..." : "Sincronizar"}
      </button>
      
      <ul>
        {courses?.map((course) => (
          <li key={course.id}>
            <h3>{course.name}</h3>
            <p>Código: {course.code}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 📝 Lista completa de hooks exportados

### Auth
- `useAuth()` - Hook completo de autenticación
- `useAuthState()` - Solo estado de autenticación
- `useLogin()` - Mutation para login
- `useRegister()` - Mutation para registro
- `useValidateToken()` - Mutation para validar token

### Courses
- `useCourses()` - Query para listar todos los cursos
- `useCourse(id)` - Query para un curso específico
- `useSyncCourses()` - Mutation para sincronizar cursos
- `useSearchCourses(query)` - Query para buscar cursos

### Schedule
- `useScheduleHistory(days)` - Query para historial
- `useScheduleEvents(start, end)` - Query para eventos
- `useClearScheduleCache()` - Mutation para limpiar cache

### Scraping
- `useSimaLogin()` - Mutation para login en SIMA
- `useScrapeCourses()` - Mutation para scraping de cursos
- `useScrapeCalendar()` - Mutation para calendario
- `useScrapeActivities()` - Mutation para actividades
- `useScrapeAll()` - Mutation para todo

