"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "@/services";
import type { Course, SyncCoursesPayload } from "@/models/course.model";

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
 * const { data: courses, isLoading, error } = useCourses();
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
 * Ejemplo de uso:
 * const { syncCoursesFn, isPending } = useSyncCourses({
 *   onSuccess: (data) => console.log("Sincronizado!", data.courses)
 * });
 * syncCoursesFn({ username: "user", password: "pass" });
 */
export function useSyncCourses(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["courses", "sync"],
    mutationFn: (credentials: SyncCoursesPayload) =>
      coursesService.syncCourses(credentials),
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
    syncCoursesFn: (credentials: SyncCoursesPayload) =>
      mutation.mutate(credentials),
    syncCoursesAsync: (credentials: SyncCoursesPayload) =>
      mutation.mutateAsync(credentials),
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
