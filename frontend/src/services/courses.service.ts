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
   */
  async syncCourses(
    credentials: SyncCoursesPayload
  ): Promise<SyncCoursesResponse> {
    const response = await simaApi.post<SyncCoursesResponse>(
      "/courses/sync",
      credentials
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
}

export const coursesService = new CoursesService();
