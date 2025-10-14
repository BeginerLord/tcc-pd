/**
 * Evento de calendario/horario
 */
export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "class" | "exam" | "assignment" | "event";
  course?: string;
  courseCode?: string;
  location?: string;
  description?: string;
  color?: string;
  allDay?: boolean;
}

/**
 * Historial de horarios por fecha
 */
export interface ScheduleHistory {
  date: string;
  events: ScheduleEvent[];
}

/**
 * Respuesta de limpieza de caché
 */
export interface ClearCacheResponse {
  success: boolean;
  message: string;
}
