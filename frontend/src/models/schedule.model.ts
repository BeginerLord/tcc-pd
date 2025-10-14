/**
 * Información de curso en una actividad
 */
export interface ActivityCourse {
  id: string;
  fullname: string;
  shortname: string;
}

/**
 * Fechas de apertura/cierre de actividad
 */
export interface ActivityDates {
  apertura?: string;
  cierre?: string;
}

/**
 * Metadata adicional de actividad
 */
export interface ActivityMetadata {
  date?: string;
  time?: string;
  actionType?: string;
  actionButton?: string;
  actionButtonUrl?: string;
  activityIcon?: string;
}

/**
 * Actividad del calendario
 */
export interface Activity {
  id: string;
  title: string;
  startTime: string; // HH:MM format
  endTime?: string;
  description?: string;
  location?: string;
  type: string; // 'assign', 'quiz', 'forum', 'exam', 'activity'
  activityDates?: ActivityDates;
  course?: ActivityCourse;
  url?: string;
  metadata?: ActivityMetadata;
}

/**
 * Datos de horario por fecha
 */
export interface ScheduleData {
  date: string; // YYYY-MM-DD
  activities: Activity[];
}

/**
 * Respuesta GET /api/schedule/day (o week, month, upcoming)
 */
export interface GetScheduleResponse {
  success: boolean;
  data: ScheduleData[];
  period: "day" | "week" | "month" | "upcoming";
  courseId: string; // "all" si no se especificó
  date: string; // YYYY-MM-DD
}

/**
 * Evento de calendario/horario (legacy - mantener para compatibilidad)
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
