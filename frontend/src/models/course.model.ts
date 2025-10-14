/**
 * Información básica de un curso (desde SIMA)
 */
export interface CourseInfo {
  id: string;
  name: string;
  shortname: string;
}

/**
 * Modelo de Curso (extendido)
 */
export interface Course {
  id: string;
  code: string;
  name: string;
  credits?: number;
  semester?: string;
  professor?: string;
  schedule?: CourseSchedule[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Respuesta GET /api/courses
 */
export interface GetCoursesResponse {
  success: boolean;
  data: CourseInfo[];
  count: number;
}

/**
 * Horario de un curso
 */
export interface CourseSchedule {
  day: string;
  startTime: string;
  endTime: string;
  location?: string;
  type?: "theory" | "lab" | "practice";
}

/**
 * Payload para sincronizar cursos
 */
export interface SyncCoursesPayload {
  username: string;
  password: string;
}

/**
 * Respuesta de sincronización de cursos
 */
export interface SyncCoursesResponse {
  success: boolean;
  courses: Course[];
  message?: string;
}
