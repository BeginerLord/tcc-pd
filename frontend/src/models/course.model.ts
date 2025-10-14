/**
 * Modelo de Curso
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
 * Horario de un curso
 */
export interface CourseSchedule {
  day: string;
  startTime: string;
  endTime: string;
  location?: string;
  type?: 'theory' | 'lab' | 'practice';
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
