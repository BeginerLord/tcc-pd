import { simaApi } from "../config";

export interface ScrapingCredentials {
  username: string;
  password: string;
}

export interface ScrapingSession {
  sessionId: string;
  cookies: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  details?: any;
}

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
  async getCourses(credentials: ScrapingCredentials): Promise<any> {
    const response = await simaApi.post("/scraping/courses", credentials);
    return response.data;
  },

  /**
   * Obtener calendario desde SIMA
   */
  async getCalendar(
    credentials: ScrapingCredentials
  ): Promise<CalendarEvent[]> {
    const response = await simaApi.post<CalendarEvent[]>(
      "/scraping/calendar",
      credentials
    );
    return response.data;
  },

  /**
   * Obtener actividades desde SIMA
   */
  async getActivities(credentials: ScrapingCredentials): Promise<any> {
    const response = await simaApi.post("/scraping/activities", credentials);
    return response.data;
  },
};
