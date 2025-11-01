"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  onSuccess?: (data: any) => void;
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
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["courses", "syncActivity", "single"],
    mutationFn: (courseId: string) =>
      coursesService.getCourseActivities(courseId),
    onSuccess: (data: any) => {
      try {
        if (data?.data?.courseId) {
          localStorage.setItem(
            `activities_${data.data.courseId}`,
            JSON.stringify(data.data)
          );
        }
        if (data?.data?.courseId) {
          queryClient.invalidateQueries({
            queryKey: ["courses", "detail", data.data.courseId],
          });
        }
        console.log(
          "✅ Actividades sincronizadas para curso:",
          data?.data?.courseName ?? data
        );
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
    syncCoursesFn: (courseId: string) => mutation.mutate(courseId),
    syncCoursesAsync: (courseId: string) => mutation.mutateAsync(courseId),
    ...mutation,
  };
}

/**
 * Hook para sincronizar actividades de varios cursos a la vez.
 */
export function useSyncAllCourseActivities(options?: {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["courses", "syncActivity", "multiple"],
    mutationFn: (courseIds: string[]) =>
      coursesService.getMultipleCoursesActivities(courseIds),
    onSuccess: (data: any) => {
      try {
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
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadActivities = () => {
    try {
      const stored = localStorage.getItem(`activities_${courseId}`);
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        setData(null);
      }
      setIsError(false);
    } catch (err: any) {
      console.error("Error cargando actividades:", err);
      setError(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [courseId]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: loadActivities,
  };
}

