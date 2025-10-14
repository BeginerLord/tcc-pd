"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "@/services";

/**
 * Keys para las queries de horarios
 */
export const scheduleKeys = {
  all: ["schedule"] as const,
  history: (days?: number) => [...scheduleKeys.all, "history", days] as const,
  events: (startDate: string, endDate: string) =>
    [...scheduleKeys.all, "events", { startDate, endDate }] as const,
};

/**
 * Hook para obtener historial de horarios.
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
 * Hook para obtener eventos de horario.
 * Ejemplo de uso:
 * const { data: events, isLoading } = useScheduleEvents("2025-01-01", "2025-01-31");
 */
export function useScheduleEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: scheduleKeys.events(startDate, endDate),
    queryFn: () => scheduleService.getEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
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

export type UseClearScheduleCacheReturn = ReturnType<typeof useClearScheduleCache>;
