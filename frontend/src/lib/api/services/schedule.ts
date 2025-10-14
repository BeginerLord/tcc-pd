import { simaApi } from "../config";

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  course?: string;
  location?: string;
  description?: string;
}

export interface ScheduleHistory {
  date: string;
  events: ScheduleEvent[];
}

/**
 * Servicio de horarios
 */
export const scheduleService = {
  /**
   * Obtener historial de horarios
   */
  async getHistory(days: number = 7): Promise<ScheduleHistory[]> {
    const response = await simaApi.get<ScheduleHistory[]>(`/schedule/history/${days}`);
    return response.data;
  },

  /**
   * Limpiar caché de horarios
   */
  async clearCache(): Promise<{ success: boolean; message: string }> {
    const response = await simaApi.delete("/schedule/cache");
    return response.data;
  },
};
