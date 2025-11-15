"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { coursesService } from "@/services";
import type {
  SyncCoursesResponse,
} from "@/models/course.model";

/**
 * Keys para las queries de cursos
 */
export const coursesKeys = {
  all: ["courses"] as const,
  lists: () => [...coursesKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...coursesKeys.lists(), { filters }] as const,
  details: () => [...coursesKeys.all, "detail"] as const,
  detail: (id: string) => [...coursesKeys.details(), id] as const,
  search: (query: string) => [...coursesKeys.all, "search", query] as const,
};

/**
 * Hook para obtener todos los cursos.
 */
export function useCourses() {
  return useQuery({
    queryKey: coursesKeys.lists(),
    queryFn: () => coursesService.getCourses(),
  });
}

/**
 * Hook para obtener un curso específico.
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
 */
export function useSyncCourses(options?: {
  onSuccess?: (data: SyncCoursesResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["courses", "sync"],
    mutationFn: () => coursesService.syncCourses(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.lists() });
      queryClient.setQueryData(coursesKeys.lists(), data.courses);
      console.log("✅ Cursos sincronizados:", data.courses.length, "cursos");
      options?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
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
 */
export function useSearchCourses(query: string) {
  return useQuery({
    queryKey: coursesKeys.search(query),
    queryFn: () => coursesService.searchCourses(query),
    enabled: query.length > 0,
  });
}

/* ============================================================
    🔹 SINCRONIZACIÓN DE ACTIVIDADES
   ============================================================ */

/**
 * Hook para sincronizar actividades de un curso específico.
 */
export function useSyncCourseActivities(options?: {
  onSuccess?: (data?: unknown) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["courses", "syncActivity", "single"],
    mutationFn: (courseId: string) =>
      coursesService.getCourseActivities(courseId),
    onSuccess: async (data: unknown) => {
  try {
    const dataObj = data as { data?: { courseId?: string } };
    const courseId = dataObj?.data?.courseId;
    if (!courseId) return;

    console.log("✅ Sincronización completada. Obteniendo actividades...");

    // Luego de sincronizar, obtener las actividades actualizadas
    const activitiesResponse = await coursesService.getCourseActivitiesList(courseId);

    if (activitiesResponse?.data) {
      localStorage.setItem(
        `activities_${courseId}`,
        JSON.stringify(activitiesResponse.data)
      );
    }

    // Refrescar cache de React Query
    queryClient.invalidateQueries({ queryKey: ["courseActivitiesList", courseId] });

    toast.success("Actividades sincronizadas correctamente", {
      description: `${activitiesResponse?.data?.totalActivities || 0} actividades obtenidas.`,
    });

    options?.onSuccess?.(activitiesResponse);
  } catch (err) {
    console.error("⚠️ Error al obtener actividades luego de sincronizar:", err);
  }
},
  });

  return {
    syncCoursesFn: (courseId: string) => mutation.mutate(courseId),
    syncCoursesAsync: (courseId: string) => mutation.mutateAsync(courseId),
    ...mutation,
  };
}

/**
 * Hook para sincronizar actividades de varios cursos a la vez.
 */
export function useSyncAllCourseActivities(options?: {
  onSuccess?: (data?: unknown) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["courses", "syncActivity", "multiple"],
    mutationFn: (courseIds: string[]) =>
      coursesService.getMultipleCoursesActivities(courseIds),
    onSuccess: (data: unknown) => {
      try {
        localStorage.setItem("allCoursesActivities", JSON.stringify(data));
        console.log("✅ Actividades sincronizadas para varios cursos");
        options?.onSuccess?.(data);
      } catch (err) {
        console.warn("⚠️ useSyncAllCourseActivities onSuccess error:", err);
      }
    },
    onError: (error: unknown) => {
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
    syncAllActivitiesAsync: (courseIds: string[]) =>
      mutation.mutateAsync(courseIds),
    ...mutation,
  };
}

/* ============================================================
    🔹 LECTURA DE ACTIVIDADES DESDE LOCALSTORAGE
   ============================================================ */

/**
 * Hook para obtener actividades de un curso desde localStorage.
 */
export function useCourseActivities(courseId: string) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadActivities = useCallback(() => {
    try {
      const stored = localStorage.getItem(`activities_${courseId}`);
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        setData(null);
      }
      setIsError(false);
    } catch (err: unknown) {
      console.error("Error cargando actividades:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: loadActivities,
  };
}

/* ============================================================
   🔹 LECTURA DE ACTIVIDADES DESDE EL BACKEND (GET)
   ============================================================ */
export function useCourseActivitiesList(courseId: string) {
  return useQuery({
    queryKey: ["courseActivitiesList", courseId],
    queryFn: () => coursesService.getCourseActivitiesList(courseId),
    enabled: !!courseId,
  });
}