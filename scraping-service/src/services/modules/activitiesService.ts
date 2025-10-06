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

      // Solo obtener fechas para asignaciones y evaluaciones
      if (event.url && (event.eventtype === 'assignment' || event.name.toLowerCase().includes('evaluación'))) {
        try {
          const activityDates = await this.getActivityDates(cookies, event.url);
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
   * @returns Array de ScheduleData agrupados por fecha
   */
  convertEventsToSchedule(events: CalendarEvent[]): ScheduleData[] {
    const scheduleData: ScheduleData[] = [];
    const eventsGroupedByDate = new Map<string, Activity[]>();

    for (const event of events) {
      const eventDate = new Date(event.timestart * 1000);
      const dateKey = eventDate.toISOString().split('T')[0];

      if (!eventsGroupedByDate.has(dateKey)) {
        eventsGroupedByDate.set(dateKey, []);
      }

      const activity: Activity = {
        id: event.id,
        title: event.name,
        startTime: eventDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        endTime: event.timeduration > 0 ?
          new Date((event.timestart + event.timeduration) * 1000).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }) : '',
        description: event.description,
        location: event.location,
        type: event.eventtype,
        activityDates: event.activityDates
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
}
