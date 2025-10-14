import { simaApi } from "../config";
import type {
  ScheduleEvent,
  ScheduleHistory,
  ScheduleData,
  GetScheduleResponse,
  ClearCacheResponse,
} from "@/models/schedule.model";

/**
 * Servicio de horarios
 */
export const scheduleService = {
  /**
   * Obtener horario por período
   * GET /api/schedule/:period?date=YYYY-MM-DD&courseId=xxx
   * @param period - "day" | "week" | "month" | "upcoming"
   * @param date - Fecha en formato YYYY-MM-DD (opcional)
   * @param courseId - ID del curso (opcional)
   */
  async getSchedule(
    period: "day" | "week" | "month" | "upcoming",
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    const params: any = {};
    if (date) params.date = date;
    if (courseId) params.courseId = courseId;

    const response = await simaApi.get<GetScheduleResponse>(
      `/schedule/${period}`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener horario del día
   * GET /api/schedule/day?date=YYYY-MM-DD
   */
  async getScheduleDay(
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    return this.getSchedule("day", date, courseId);
  },

  /**
   * Obtener horario de la semana
   * GET /api/schedule/week?date=YYYY-MM-DD
   */
  async getScheduleWeek(
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    return this.getSchedule("week", date, courseId);
  },

  /**
   * Obtener horario del mes
   * GET /api/schedule/month?date=YYYY-MM-DD
   */
  async getScheduleMonth(
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    return this.getSchedule("month", date, courseId);
  },

  /**
   * Obtener actividades próximas
   * GET /api/schedule/upcoming
   */
  async getScheduleUpcoming(courseId?: string): Promise<GetScheduleResponse> {
    return this.getSchedule("upcoming", undefined, courseId);
  },

  /**
   * Obtener historial de horarios (legacy)
   */
  async getHistory(days: number = 7): Promise<ScheduleHistory[]> {
    const response = await simaApi.get<ScheduleHistory[]>(
      `/schedule/history/${days}`
    );
    return response.data;
  },

  /**
   * Obtener eventos de horario para un rango de fechas
   */
  async getEvents(
    startDate: string,
    endDate: string
  ): Promise<ScheduleEvent[]> {
    const response = await simaApi.get<ScheduleEvent[]>("/schedule/events", {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Limpiar caché de horarios
   */
  async clearCache(): Promise<ClearCacheResponse> {
    const response = await simaApi.delete<ClearCacheResponse>(
      "/schedule/cache"
    );
    return response.data;
  },
};
