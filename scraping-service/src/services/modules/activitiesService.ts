/**
 * Activities Service
 * Maneja la extracción de fechas de apertura/cierre de actividades específicas
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { CookieParser } from '../helpers';
import { CalendarEvent, Activity, ScheduleData } from '../../types';

export class ActivitiesService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SIMA_BASE_URL || 'https://sima.unicartagena.edu.co';
  }

  /**
   * Obtiene las fechas de apertura y cierre de una actividad específica
   * @param cookies Array de cookies del usuario
   * @param activityUrl URL de la actividad
   * @returns Objeto con fechas de apertura y cierre
   */
  async getActivityDates(cookies: string[], activityUrl: string): Promise<{ apertura?: string; cierre?: string }> {
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);

      // Si la URL es de tipo /mod/assign/view.php, intentar con action=editsubmission
      let urlToFetch = activityUrl;
      if (activityUrl.includes('/mod/assign/view.php') && !activityUrl.includes('action=')) {
        urlToFetch = activityUrl.includes('?')
          ? `${activityUrl}&action=editsubmission`
          : `${activityUrl}?action=editsubmission`;
      }

      const response = await axios.get(urlToFetch, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.5',
          'Cache-Control': 'max-age=0',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const activityDates: { apertura?: string; cierre?: string } = {};

      // Buscar el bloque de fechas de actividad
      const activityDatesDiv = $('[data-region="activity-dates"]');

      if (activityDatesDiv.length > 0) {
        // Buscar fecha de apertura y cierre
        activityDatesDiv.find('div').each((i, el) => {
          const text = $(el).text();
          const strongText = $(el).find('strong').text().trim();

          if (strongText === 'Apertura:') {
            const aperturaText = text.replace('Apertura:', '').trim();
            if (aperturaText) {
              activityDates.apertura = aperturaText;
            }
          } else if (strongText === 'Cierre:') {
            const cierreText = text.replace('Cierre:', '').trim();
            if (cierreText) {
              activityDates.cierre = cierreText;
            }
          }
        });
      }

      return activityDates;
    } catch (error) {
      console.error(`Error extracting activity dates from ${activityUrl}:`, error);
      return {};
    }
  }

  /**
   * Enriquece eventos con fechas de apertura y cierre
   * @param cookies Array de cookies del usuario
   * @param events Array de eventos del calendario
   * @returns Array de eventos enriquecidos
   */
  async enhanceEventsWithActivityDates(cookies: string[], events: CalendarEvent[]): Promise<CalendarEvent[]> {
    const enhancedEvents: CalendarEvent[] = [];

    for (const event of events) {
      const enhancedEvent = { ...event };

      // Intentar obtener fechas de la URL del botón de acción si está disponible
      let urlToFetch = event.url;
      if (event.metadata?.actionButtonUrl) {
        urlToFetch = event.metadata.actionButtonUrl;
      }

      // Obtener fechas para tareas, cuestionarios y otros tipos de actividades
      if (urlToFetch && (
        event.eventtype === 'assign' ||
        event.eventtype === 'assignment' ||
        event.eventtype === 'quiz' ||
        event.name.toLowerCase().includes('evaluación') ||
        event.metadata?.actionType?.toLowerCase().includes('tarea') ||
        event.metadata?.actionType?.toLowerCase().includes('cuestionario')
      )) {
        try {
          const activityDates = await this.getActivityDates(cookies, urlToFetch);
          if (activityDates.apertura || activityDates.cierre) {
            enhancedEvent.activityDates = activityDates;
          }
        } catch (error) {
          console.error(`Failed to get activity dates for ${event.name}:`, error);
        }
      }

      enhancedEvents.push(enhancedEvent);
    }

    return enhancedEvents;
  }

  /**
   * Convierte eventos del calendario en datos de horario estructurados
   * @param events Array de eventos del calendario
   * @param courses Array de cursos del usuario (opcional, para enriquecer datos)
   * @returns Array de ScheduleData agrupados por fecha
   */
  convertEventsToSchedule(events: CalendarEvent[], courses?: any[]): ScheduleData[] {
    const scheduleData: ScheduleData[] = [];
    const eventsGroupedByDate = new Map<string, Activity[]>();

    // Crear mapa de cursos por ID para búsqueda rápida
    const coursesMap = new Map<string, any>();
    if (courses) {
      for (const course of courses) {
        coursesMap.set(course.id, course);
      }
    }

    for (const event of events) {
      // Si el evento tiene metadata con fecha, usarla; sino usar el timestamp
      let dateKey: string;
      let startTime: string;

      if (event.metadata?.date && event.metadata?.time) {
        // Usar la fecha del metadata (más precisa para vista de día)
        dateKey = this.parseDateToISO(event.metadata.date);
        startTime = event.metadata.time;
      } else {
        // Usar el timestamp
        const eventDate = new Date(event.timestart * 1000);
        dateKey = eventDate.toISOString().split('T')[0];
        startTime = eventDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      if (!eventsGroupedByDate.has(dateKey)) {
        eventsGroupedByDate.set(dateKey, []);
      }

      // Enriquecer información del curso si solo tenemos el ID
      let courseInfo = event.course;
      if (courseInfo && courseInfo.id && !courseInfo.fullname && coursesMap.has(courseInfo.id)) {
        const fullCourseData = coursesMap.get(courseInfo.id);
        courseInfo = {
          id: courseInfo.id,
          fullname: fullCourseData.fullname || fullCourseData.name,
          shortname: fullCourseData.shortname || fullCourseData.fullname?.split('-').pop()?.trim() || ''
        };
      }

      const activity: Activity = {
        id: event.id,
        title: event.name,
        startTime: startTime,
        endTime: event.timeduration > 0 ?
          new Date((event.timestart + event.timeduration) * 1000).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }) : undefined,
        description: event.description,
        location: event.location,
        type: event.eventtype,
        activityDates: event.activityDates,
        course: courseInfo,
        url: event.url,
        metadata: event.metadata
      };

      eventsGroupedByDate.get(dateKey)!.push(activity);
    }

    // Convertir el Map a array y ordenar
    for (const [date, activities] of eventsGroupedByDate.entries()) {
      scheduleData.push({
        date,
        activities: activities.sort((a, b) => a.startTime.localeCompare(b.startTime))
      });
    }

    return scheduleData.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Convierte una fecha en formato español a ISO (YYYY-MM-DD)
   * @param dateStr Fecha en formato español (ej: "sábado, 11 de octubre de 2025")
   * @returns Fecha en formato ISO
   */
  private parseDateToISO(dateStr: string): string {
    const months: { [key: string]: string } = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    // Formato: "sábado, 11 de octubre de 2025"
    const match = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = months[match[2].toLowerCase()] || '01';
      const year = match[3];
      return `${year}-${month}-${day}`;
    }

    // Fallback: usar fecha actual
    return new Date().toISOString().split('T')[0];
  }
}
