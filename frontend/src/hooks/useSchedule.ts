"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "@/services";
import type { GetScheduleResponse } from "@/models/schedule.model";

/**
 * Keys para las queries de horarios
 */
export const scheduleKeys = {
  all: ["schedule"] as const,
  day: (date?: string, courseId?: string) =>
    [...scheduleKeys.all, "day", { date, courseId }] as const,
  week: (date?: string, courseId?: string) =>
    [...scheduleKeys.all, "week", { date, courseId }] as const,
  month: (date?: string, courseId?: string) =>
    [...scheduleKeys.all, "month", { date, courseId }] as const,
  upcoming: (courseId?: string) =>
    [...scheduleKeys.all, "upcoming", { courseId }] as const,
  history: (days?: number) => [...scheduleKeys.all, "history", days] as const,
};

/**
 * Hook para obtener horario del día.
 * Ejemplo de uso:
 * const { data, isLoading } = useScheduleDay("2025-10-11");
 * // data contiene { success, data: ScheduleData[], period, courseId, date }
 */
export function useScheduleDay(date?: string, courseId?: string) {
  return useQuery({
    queryKey: scheduleKeys.day(date, courseId),
    queryFn: () => scheduleService.getScheduleDay(date, courseId),
  });
}

/**
 * Hook para obtener horario de la semana.
 */
export function useScheduleWeek(date?: string, courseId?: string) {
  return useQuery({
    queryKey: scheduleKeys.week(date, courseId),
    queryFn: () => scheduleService.getScheduleWeek(date, courseId),
  });
}

/**
 * Hook para obtener horario del mes.
 */
export function useScheduleMonth(date?: string, courseId?: string) {
  return useQuery({
    queryKey: scheduleKeys.month(date, courseId),
    queryFn: () => scheduleService.getScheduleMonth(date, courseId),
  });
}

/**
 * Hook para obtener actividades próximas.
 */
export function useScheduleUpcoming(courseId?: string) {
  return useQuery({
    queryKey: scheduleKeys.upcoming(courseId),
    queryFn: () => scheduleService.getScheduleUpcoming(courseId),
  });
}

/**
 * Hook para obtener horario genérico por período.
 */
export function useSchedule(
  period: "day" | "week" | "month" | "upcoming",
  date?: string,
  courseId?: string
) {
  return useQuery({
    queryKey: [...scheduleKeys.all, period, { date, courseId }],
    queryFn: () => scheduleService.getSchedule(period, date, courseId),
  });
}

/**
 * Hook para obtener historial de horarios (legacy).
 * Ejemplo de uso:
 * const { data: history, isLoading } = useScheduleHistory(7);
 */
export function useScheduleHistory(days: number = 7) {
  return useQuery({
    queryKey: scheduleKeys.history(days),
    queryFn: () => scheduleService.getHistory(days),
  });
}

/**
 * Hook para limpiar caché de horarios.
 * Ejemplo de uso:
 * const { clearCacheFn, isPending } = useClearScheduleCache({
 *   onSuccess: () => console.log("Caché limpiado!")
 * });
 * clearCacheFn();
 */
export function useClearScheduleCache(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["schedule", "clearCache"],
    mutationFn: () => scheduleService.clearCache(),
    onSuccess: (data) => {
      // Invalidar todas las queries de schedule
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });

      console.log("✅ Caché de horarios limpiado");
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al limpiar el caché";
      console.error("❌ Error al limpiar caché:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    clearCacheFn: () => mutation.mutate(),
    clearCacheAsync: () => mutation.mutateAsync(),
    ...mutation,
  };
}

export type UseClearScheduleCacheReturn = ReturnType<
  typeof useClearScheduleCache
>;
