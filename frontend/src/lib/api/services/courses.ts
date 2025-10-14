import { simaApi } from "../config";

export interface Course {
  id: string;
  code: string;
  name: string;
  credits?: number;
  semester?: string;
  schedule?: any;
}

export interface SyncCoursesPayload {
  username: string;
  password: string;
}

/**
 * Servicio de cursos
 */
export const coursesService = {
  /**
   * Obtener todos los cursos del usuario
   */
  async getCourses(): Promise<Course[]> {
    const response = await simaApi.get<Course[]>("/courses");
    return response.data;
  },

  /**
   * Obtener un curso específico
   */
  async getCourse(courseId: string): Promise<Course> {
    const response = await simaApi.get<Course>(`/courses/${courseId}`);
    return response.data;
  },

  /**
   * Sincronizar cursos desde SIMA
   */
  async syncCourses(
    credentials: SyncCoursesPayload
  ): Promise<{ success: boolean; courses: Course[] }> {
    const response = await simaApi.post("/courses/sync", credentials);
    return response.data;
  },
};
