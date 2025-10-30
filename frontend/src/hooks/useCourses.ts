"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "@/services";
import type {
  Course,
  CourseInfo,
  GetCoursesResponse,
  SyncCoursesPayload,
} from "@/models/course.model";

/**
 * Keys para las queries de cursos
 */
export const coursesKeys = {
  all: ["courses"] as const,
  lists: () => [...coursesKeys.all, "list"] as const,
  list: (filters?: any) => [...coursesKeys.lists(), { filters }] as const,
  details: () => [...coursesKeys.all, "detail"] as const,
  detail: (id: string) => [...coursesKeys.details(), id] as const,
  search: (query: string) => [...coursesKeys.all, "search", query] as const,
};

/**
 * Hook para obtener todos los cursos.
 * Ejemplo de uso:
 * const { data, isLoading, error } = useCourses();
 * // data contiene { success, data: CourseInfo[], count }
 */
export function useCourses() {
  return useQuery({
    queryKey: coursesKeys.lists(),
    queryFn: () => coursesService.getCourses(),
  });
}

/**
 * Hook para obtener un curso específico.
 * Ejemplo de uso:
 * const { data: course, isLoading } = useCourse(courseId);
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: coursesKeys.detail(courseId),
    queryFn: () => coursesService.getCourse(courseId),
    enabled: !!courseId,
  });
}

/**
 * Hook para sincronizar cursos desde SIMA.
 * No requiere credenciales, usa el token de autorización del usuario.
 * Ejemplo de uso:
 * const { syncCoursesFn, isPending } = useSyncCourses({
 *   onSuccess: (data) => console.log("Sincronizado!", data.courses)
 * });
 * syncCoursesFn();
 */
export function useSyncCourses(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["courses", "sync"],
    mutationFn: () => coursesService.syncCourses(),
    onSuccess: (data) => {
      // Invalidar y actualizar el cache de cursos
      queryClient.invalidateQueries({ queryKey: coursesKeys.lists() });
      // Opcionalmente, setear directamente los datos
      queryClient.setQueryData(coursesKeys.lists(), data.courses);

      console.log("✅ Cursos sincronizados:", data.courses.length, "cursos");
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al sincronizar cursos";
      console.error("❌ Error al sincronizar cursos:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    syncCoursesFn: () => mutation.mutate(),
    syncCoursesAsync: () => mutation.mutateAsync(),
    ...mutation,
  };
}

export type UseSyncCoursesReturn = ReturnType<typeof useSyncCourses>;

/**
 * Hook para buscar cursos.
 * Ejemplo de uso:
 * const { data: courses, isLoading } = useSearchCourses("calculo");
 */
export function useSearchCourses(query: string) {
  return useQuery({
    queryKey: coursesKeys.search(query),
    queryFn: () => coursesService.searchCourses(query),
    enabled: query.length > 0,
  });
}

/* ============================================================
    Sincronización de actividades
   ============================================================ */

/**
 * Hook para sincronizar actividades de un curso específico
 * Endpoint esperado: POST /api/scraping/course/:courseId/activities
 */
export function useSyncCourseActivities(options?: {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  // clave local para esta mutación (no tocamos coursesKeys original)
  const mutationKey = ["courses", "syncActivity", "single"] as const;

  const mutation = useMutation({
    mutationKey,
    // asumimos que coursesService tiene syncSingleCourse(courseId: string)
    mutationFn: (courseId: string) => (coursesService as any).getCourseActivities(courseId),
    onSuccess: (data: any) => {
      try {
        // Guardar actividades del curso en localStorage (key: activities_<courseId>)
        if (data?.data?.courseId) {
          localStorage.setItem(
            `activities_${data.data.courseId}`,
            JSON.stringify(data.data)
          );
        }

        // invalidar cache del detalle del curso si está en uso
        if (data?.data?.courseId) {
          queryClient.invalidateQueries({
            queryKey: ["courses", "detail", data.data.courseId],
          });
        }

        console.log("✅ Actividades sincronizadas para curso:", data?.data?.courseName ?? data);
        options?.onSuccess?.(data);
      } catch (err) {
        console.warn("⚠️ useSyncCourseActivities onSuccess error:", err);
      }
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Error al sincronizar actividades del curso";
      console.error("❌ useSyncCourseActivities:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    // función pública para disparar la sincronización (mutate)
    syncCourseActivities: (courseId: string) => mutation.mutate(courseId),
    syncCourseActivitiesAsync: (courseId: string) => mutation.mutateAsync(courseId),
    // expongo el resto del objeto mutation para control (isLoading, isError, etc.)
    ...mutation,
  };
}

/**
 * Hook para sincronizar actividades de varios cursos a la vez
 * Endpoint esperado: POST /api/scraping/courses/activities
 *
 * Guardará el resultado completo en localStorage con la key "allCoursesActivities".
 */
export function useSyncAllCourseActivities(options?: {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
}) {
  // clave local para esta mutación
  const mutationKey = ["courses", "syncActivity", "multiple"] as const;

  const mutation = useMutation({
    mutationKey,
    mutationFn: (courseIds: string[]) => (coursesService as any).getMultipleCoursesActivities(courseIds),
    onSuccess: (data: any) => {
      try {
        // Guardar todas las actividades en localStorage
        localStorage.setItem("allCoursesActivities", JSON.stringify(data));
        console.log("✅ Actividades sincronizadas para varios cursos");
        options?.onSuccess?.(data);
      } catch (err) {
        console.warn("⚠️ useSyncAllCourseActivities onSuccess error:", err);
      }
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Error al sincronizar actividades de varios cursos";
      console.error("❌ useSyncAllCourseActivities:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    syncAllActivities: (courseIds: string[]) => mutation.mutate(courseIds),
    syncAllActivitiesAsync: (courseIds: string[]) => mutation.mutateAsync(courseIds),
    ...mutation,
  };
}

export function syncAllActivitiesAsyncs(options?: {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["courses", "syncActivity", "multiple"],
    mutationFn: (courseIds: string[]) =>
      coursesService.getMultipleCoursesActivities(courseIds),
    onSuccess: (data) => {
      localStorage.setItem("allCoursesActivities", JSON.stringify(data));
      console.log("✅ Actividades sincronizadas para varios cursos:", data);
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error("❌ Error al sincronizar varios cursos:", error);
      options?.onError?.(error);
    },
  });

  return {
    syncAllActivities: (courseIds: string[]) => mutation.mutate(courseIds),
    ...mutation,
  };
}

