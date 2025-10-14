import { simaApi } from "../config";
import type {
  ScrapingCredentials,
  ScrapingSession,
  CalendarEvent,
  Activity,
  ScrapingResponse,
} from "@/models/scraping.model";
import type { Course } from "@/models/course.model";

/**
 * Servicio de scraping
 */
export const scrapingService = {
  /**
   * Iniciar sesión en SIMA
   */
  async login(credentials: ScrapingCredentials): Promise<ScrapingSession> {
    const response = await simaApi.post<ScrapingSession>(
      "/scraping/login",
      credentials
    );
    return response.data;
  },

  /**
   * Obtener cursos desde SIMA
   */
  async getCourses(
    credentials: ScrapingCredentials
  ): Promise<ScrapingResponse<Course[]>> {
    const response = await simaApi.post<ScrapingResponse<Course[]>>(
      "/scraping/courses",
      credentials
    );
    return response.data;
  },

  /**
   * Obtener calendario desde SIMA
   */
  async getCalendar(
    credentials: ScrapingCredentials
  ): Promise<ScrapingResponse<CalendarEvent[]>> {
    const response = await simaApi.post<ScrapingResponse<CalendarEvent[]>>(
      "/scraping/calendar",
      credentials
    );
    return response.data;
  },

  /**
   * Obtener actividades desde SIMA
   */
  async getActivities(
    credentials: ScrapingCredentials
  ): Promise<ScrapingResponse<Activity[]>> {
    const response = await simaApi.post<ScrapingResponse<Activity[]>>(
      "/scraping/activities",
      credentials
    );
    return response.data;
  },

  /**
   * Scraping completo de todos los datos
   */
  async scrapeAll(credentials: ScrapingCredentials): Promise<{
    courses: Course[];
    calendar: CalendarEvent[];
    activities: Activity[];
  }> {
    const [coursesRes, calendarRes, activitiesRes] = await Promise.all([
      this.getCourses(credentials),
      this.getCalendar(credentials),
      this.getActivities(credentials),
    ]);

    return {
      courses: coursesRes.data,
      calendar: calendarRes.data,
      activities: activitiesRes.data,
    };
  },
};
