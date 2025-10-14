"use client";

import { useMutation } from "@tanstack/react-query";
import { scrapingService } from "@/services";
import type { ScrapingCredentials } from "@/models/scraping.model";

/**
 * Hook para login en SIMA.
 * Ejemplo de uso:
 * const { simaLoginFn, isPending } = useSimaLogin({
 *   onSuccess: (session) => console.log("Session ID:", session.sessionId)
 * });
 * simaLoginFn({ username: "user", password: "pass" });
 */
export function useSimaLogin(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["scraping", "login"],
    mutationFn: (credentials: ScrapingCredentials) =>
      scrapingService.login(credentials),
    onSuccess: (data) => {
      console.log("✅ Login en SIMA exitoso");
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al iniciar sesión en SIMA";
      console.error("❌ Error al iniciar sesión en SIMA:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    simaLoginFn: (credentials: ScrapingCredentials) =>
      mutation.mutate(credentials),
    simaLoginAsync: (credentials: ScrapingCredentials) =>
      mutation.mutateAsync(credentials),
    ...mutation,
  };
}

export type UseSimaLoginReturn = ReturnType<typeof useSimaLogin>;

/**
 * Hook para obtener cursos desde SIMA.
 * Ejemplo de uso:
 * const { scrapeCoursesFn, isPending, data } = useScrapeCourses({
 *   onSuccess: (data) => console.log("Cursos:", data)
 * });
 */
export function useScrapeCourses(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["scraping", "courses"],
    mutationFn: (credentials: ScrapingCredentials) =>
      scrapingService.getCourses(credentials),
    onSuccess: (data) => {
      console.log("✅ Cursos obtenidos de SIMA:", data.data?.length || 0);
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al obtener cursos de SIMA";
      console.error("❌ Error al obtener cursos de SIMA:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    scrapeCoursesFn: (credentials: ScrapingCredentials) =>
      mutation.mutate(credentials),
    scrapeCoursesAsync: (credentials: ScrapingCredentials) =>
      mutation.mutateAsync(credentials),
    ...mutation,
  };
}

export type UseScrapeCoursesReturn = ReturnType<typeof useScrapeCourses>;

/**
 * Hook para obtener calendario desde SIMA.
 * Ejemplo de uso:
 * const { scrapeCalendarFn, isPending } = useScrapeCalendar();
 */
export function useScrapeCalendar(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["scraping", "calendar"],
    mutationFn: (credentials: ScrapingCredentials) =>
      scrapingService.getCalendar(credentials),
    onSuccess: (data) => {
      console.log("✅ Calendario obtenido de SIMA");
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al obtener el calendario de SIMA";
      console.error("❌ Error al obtener calendario de SIMA:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    scrapeCalendarFn: (credentials: ScrapingCredentials) =>
      mutation.mutate(credentials),
    scrapeCalendarAsync: (credentials: ScrapingCredentials) =>
      mutation.mutateAsync(credentials),
    ...mutation,
  };
}

export type UseScrapeCalendarReturn = ReturnType<typeof useScrapeCalendar>;

/**
 * Hook para obtener actividades desde SIMA.
 * Ejemplo de uso:
 * const { scrapeActivitiesFn, isPending } = useScrapeActivities();
 */
export function useScrapeActivities(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["scraping", "activities"],
    mutationFn: (credentials: ScrapingCredentials) =>
      scrapingService.getActivities(credentials),
    onSuccess: (data) => {
      console.log("✅ Actividades obtenidas de SIMA");
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al obtener actividades de SIMA";
      console.error("❌ Error al obtener actividades de SIMA:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    scrapeActivitiesFn: (credentials: ScrapingCredentials) =>
      mutation.mutate(credentials),
    scrapeActivitiesAsync: (credentials: ScrapingCredentials) =>
      mutation.mutateAsync(credentials),
    ...mutation,
  };
}

export type UseScrapeActivitiesReturn = ReturnType<typeof useScrapeActivities>;

/**
 * Hook para scraping completo de SIMA.
 * Ejemplo de uso:
 * const { scrapeAllFn, isPending, data } = useScrapeAll({
 *   onSuccess: (data) => {
 *     console.log("Cursos:", data.courses);
 *     console.log("Calendario:", data.calendar);
 *     console.log("Actividades:", data.activities);
 *   }
 * });
 * scrapeAllFn({ username: "1003027895", password: "Akaza1999$" });
 */
export function useScrapeAll(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["scraping", "all"],
    mutationFn: (credentials: ScrapingCredentials) =>
      scrapingService.scrapeAll(credentials),
    onSuccess: (data) => {
      console.log("✅ Todos los datos obtenidos de SIMA");
      console.log("  - Cursos:", data.courses.length);
      console.log("  - Eventos calendario:", data.calendar.length);
      console.log("  - Actividades:", data.activities.length);
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al obtener datos de SIMA";
      console.error("❌ Error al obtener datos de SIMA:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    scrapeAllFn: (credentials: ScrapingCredentials) =>
      mutation.mutate(credentials),
    scrapeAllAsync: (credentials: ScrapingCredentials) =>
      mutation.mutateAsync(credentials),
    ...mutation,
  };
}

export type UseScrapeAllReturn = ReturnType<typeof useScrapeAll>;
