import { simaApi } from "@/lib/api/config";
import type {
  ScheduleEvent,
  ScheduleHistory,
  ClearCacheResponse,
} from "@/models/schedule.model";

/**
 * Servicio de horarios
 */
class ScheduleService {
  /**
   * Obtener historial de horarios
   */
  async getHistory(days: number = 7): Promise<ScheduleHistory[]> {
    const response = await simaApi.get<ScheduleHistory[]>(
      `/schedule/history/${days}`
    );
    return response.data;
  }

  /**
   * Obtener eventos de horario para un rango de fechas
   */
  async getEvents(startDate: string, endDate: string): Promise<ScheduleEvent[]> {
    const response = await simaApi.get<ScheduleEvent[]>("/schedule/events", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Limpiar caché de horarios
   */
  async clearCache(): Promise<ClearCacheResponse> {
    const response = await simaApi.delete<ClearCacheResponse>("/schedule/cache");
    return response.data;
  }
}

export const scheduleService = new ScheduleService();
