import { simaApi } from "@/lib/api/config";
import type {
  ScheduleEvent,
  ScheduleHistory,
  GetScheduleResponse,
  ClearCacheResponse,
} from "@/models/schedule.model";

/**
 * Servicio de horarios
 */
class ScheduleService {
  /**
   * Obtener horario por período
   * GET /api/schedule/:period?date=YYYY-MM-DD&courseId=xxx
   */
  async getSchedule(
    period: "day" | "week" | "month" | "upcoming",
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (courseId) params.courseId = courseId;

    const response = await simaApi.get<GetScheduleResponse>(
      `/schedule/${period}`,
      { params }
    );
    return response.data;
  }

  /**
   * Obtener horario del día
   */
  async getScheduleDay(
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    return this.getSchedule("day", date, courseId);
  }

  /**
   * Obtener horario de la semana
   */
  async getScheduleWeek(
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    return this.getSchedule("week", date, courseId);
  }

  /**
   * Obtener horario del mes
   */
  async getScheduleMonth(
    date?: string,
    courseId?: string
  ): Promise<GetScheduleResponse> {
    return this.getSchedule("month", date, courseId);
  }

  /**
   * Obtener actividades próximas
   */
  async getScheduleUpcoming(courseId?: string): Promise<GetScheduleResponse> {
    return this.getSchedule("upcoming", undefined, courseId);
  }

  /**
   * Obtener historial de horarios (legacy)
   */
  async getHistory(days: number = 7): Promise<ScheduleHistory[]> {
    const response = await simaApi.get<ScheduleHistory[]>(
      `/schedule/history/${days}`
    );
    return response.data;
  }

  /**
   * Obtener eventos de horario para un rango de fechas (legacy)
   */
  async getEvents(
    startDate: string,
    endDate: string
  ): Promise<ScheduleEvent[]> {
    const response = await simaApi.get<ScheduleEvent[]>("/schedule/events", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Limpiar caché de horarios
   */
  async clearCache(): Promise<ClearCacheResponse> {
    const response = await simaApi.delete<ClearCacheResponse>(
      "/schedule/cache"
    );
    return response.data;
  }
}

export const scheduleService = new ScheduleService();
