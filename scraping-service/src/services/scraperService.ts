/**
 * Scraper Service - Orchestrator
 * Servicio principal que orquesta todos los módulos de scraping
 * Mantiene compatibilidad con la API existente
 */

import { Activity, ScheduleData, CourseInfo, CalendarEvent } from '../types';
import {
  SessionService,
  CoursesService,
  CalendarService,
  ActivitiesService
} from './modules';

export class ScraperService {
  private baseUrl: string;
  private sessionService: SessionService;
  private coursesService: CoursesService;
  private calendarService: CalendarService;
  private activitiesService: ActivitiesService;

  constructor() {
    this.baseUrl = process.env.SIMA_BASE_URL || 'https://sima.unicartagena.edu.co';

    // Inicializar servicios modulares
    this.sessionService = new SessionService(this.baseUrl);
    this.coursesService = new CoursesService(this.baseUrl);
    this.calendarService = new CalendarService(this.baseUrl);
    this.activitiesService = new ActivitiesService(this.baseUrl);
  }

  /**
   * Obtiene el session key de SIMA
   * @param cookies Array de cookies del usuario
   * @returns Session key string
   */
  async getSessionKey(cookies: string[]): Promise<string> {
    return this.sessionService.getSessionKey(cookies);
  }

  /**
   * Obtiene los cursos del usuario
   * @param cookies Array de cookies del usuario
   * @returns Array de CourseInfo
   */
  async getUserCourses(cookies: string[]): Promise<CourseInfo[]> {
    return this.coursesService.getUserCourses(cookies);
  }

  /**
   * Obtiene eventos del calendario
   * @param cookies Array de cookies del usuario
   * @param view Tipo de vista (day, month, upcoming)
   * @param courseId ID del curso (opcional)
   * @param date Fecha específica (opcional)
   * @returns Array de CalendarEvent
   */
  async getCalendarEvents(
    cookies: string[],
    view: 'day' | 'month' | 'upcoming' = 'month',
    courseId?: string,
    date?: string
  ): Promise<CalendarEvent[]> {
    return this.calendarService.getCalendarEvents(cookies, view, courseId, date);
  }

  /**
   * Obtiene eventos próximos de un curso específico
   * @param cookies Array de cookies del usuario
   * @param courseId ID del curso
   * @returns Array de CalendarEvent
   */
  async getUpcomingEvents(cookies: string[], courseId: string): Promise<CalendarEvent[]> {
    return this.calendarService.getUpcomingEvents(cookies, courseId);
  }

  /**
   * Obtiene las fechas de apertura y cierre de una actividad
   * @param cookies Array de cookies del usuario
   * @param activityUrl URL de la actividad
   * @returns Objeto con fechas de apertura y cierre
   */
  async getActivityDates(cookies: string[], activityUrl: string): Promise<{ apertura?: string; cierre?: string }> {
    return this.activitiesService.getActivityDates(cookies, activityUrl);
  }

  /**
   * Enriquece eventos con fechas de apertura y cierre
   * @param cookies Array de cookies del usuario
   * @param events Array de eventos
   * @returns Array de eventos enriquecidos
   */
  async enhanceEventsWithActivityDates(cookies: string[], events: CalendarEvent[]): Promise<CalendarEvent[]> {
    return this.activitiesService.enhanceEventsWithActivityDates(cookies, events);
  }

  /**
   * Valida si las cookies de sesión son válidas
   * @param cookies Array de cookies del usuario
   * @returns true si la sesión es válida
   */
  async validateSession(cookies: string[]): Promise<boolean> {
    return this.sessionService.validateSession(cookies);
  }

  /**
   * Obtiene el horario/calendario estructurado por período
   * @param cookies Array de cookies del usuario
   * @param period Período (day, week, month, upcoming)
   * @param courseId ID del curso (opcional)
   * @param date Fecha específica (opcional)
   * @returns Array de ScheduleData
   */
  async scrapeSchedule(
    cookies: string[],
    period: 'day' | 'week' | 'month' | 'upcoming',
    courseId?: string,
    date?: string
  ): Promise<ScheduleData[]> {
    try {
      // Validar sesión antes de hacer scraping
      const isSessionValid = await this.sessionService.validateSession(cookies);
      if (!isSessionValid) {
        throw new Error('Session expired or invalid cookies. Please login again.');
      }

      // Convertir 'week' a 'month' para la vista
      const view = period === 'week' ? 'month' : period;

      // Obtener eventos del calendario
      let events = await this.calendarService.getCalendarEvents(
        cookies,
        view as any,
        courseId,
        date
      );

      // Enriquecer con fechas de actividades
      events = await this.activitiesService.enhanceEventsWithActivityDates(cookies, events);

      // Convertir eventos a formato de horario
      return this.activitiesService.convertEventsToSchedule(events);
    } catch (error) {
      throw new Error(`Failed to scrape schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
