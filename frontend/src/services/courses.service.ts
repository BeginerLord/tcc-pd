import { simaApi } from "@/lib/api/config";
import type {
  Course,
  CourseInfo,
  GetCoursesResponse,
  SyncCoursesPayload,
  SyncCoursesResponse,
} from "@/models/course.model";

/**
 * Servicio de cursos
 */
class CoursesService {
   // ============================
  // 🔹 SECCIÓN 1: Cursos generales
  // ============================

  /**
   * Obtener todos los cursos del usuario
   * GET /api/courses
   */
  async getCourses(): Promise<GetCoursesResponse> {
    const response = await simaApi.get<GetCoursesResponse>("/courses");
    return response.data;
  }

  /**
   * Obtener un curso específico
   */
  async getCourse(courseId: string): Promise<Course> {
    const response = await simaApi.get<Course>(`/courses/${courseId}`);
    return response.data;
  }

  /**
   * Sincronizar cursos desde SIMA
   * No requiere credenciales, usa el token de autorización
   */
  async syncCourses(): Promise<SyncCoursesResponse> {
    const response = await simaApi.post<SyncCoursesResponse>(
      "/courses/sync"
    );
    return response.data;
  }

  /**
   * Buscar cursos por código o nombre
   */
  async searchCourses(query: string): Promise<Course[]> {
    const response = await simaApi.get<Course[]>(`/courses/search`, {
      params: { q: query },
    });
    return response.data;
  }

  // ============================
  // 🔹 SECCIÓN 2: Actividades (Scraping)
  // ============================

   //Obtener actividades de un curso
  async getCourseActivities(courseId: string) {
  const cookies = JSON.parse(sessionStorage.getItem("cookies") || "[]");
  const response = await simaApi.post(`/scraping/course/${courseId}/activities`, {
    cookies
  });
  return response.data;
}


  //Obtener actividades de varios cursos
  async getMultipleCoursesActivities(courseIds: string[]) {
  const cookies = JSON.parse(sessionStorage.getItem("cookies") || "[]");
  const response = await simaApi.post(`/scraping/courses/activities`, {
    cookies,
    courseIds
  });
  return response.data;
}
}

export const coursesService = new CoursesService();
