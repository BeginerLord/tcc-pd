/**
 * Calendar Service
 * Maneja la obtención y parsing de eventos del calendario de SIMA
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { CalendarEvent } from '../../types';
import { CookieParser, TimeParser, EventTypeDetector } from '../helpers';
import { SessionService } from './sessionService';

export class CalendarService {
  private baseUrl: string;
  private sessionService: SessionService;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SIMA_BASE_URL || 'https://sima.unicartagena.edu.co';
    this.sessionService = new SessionService(this.baseUrl);
  }

  /**
   * Obtiene eventos del calendario según el tipo de vista
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
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);

      if (view === 'upcoming' && courseId) {
        return this.getUpcomingEvents(cookies, courseId);
      }

      let url = `${this.baseUrl}/calendar/view.php?view=${view}&course=${courseId || 1}`;

      if (date && view !== 'upcoming') {
        const timestamp = new Date(date).getTime() / 1000;
        url += `&time=${timestamp}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9'
        }
      });

      return this.parseCalendarHTML(response.data, view);
    } catch (error) {
      throw new Error(`Failed to get calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene eventos próximos (upcoming) de un curso específico via AJAX
   * @param cookies Array de cookies del usuario
   * @param courseId ID del curso
   * @returns Array de CalendarEvent
   */
  async getUpcomingEvents(cookies: string[], courseId: string): Promise<CalendarEvent[]> {
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);
      const sesskey = await this.sessionService.getSessionKey(cookies);

      const payload = [{
        index: 0,
        methodname: "core_calendar_get_calendar_upcoming_view",
        args: {
          courseid: courseId
        }
      }];

      const response = await axios.post(
        `${this.baseUrl}/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_calendar_upcoming_view`,
        payload,
        {
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'es-419,es;q=0.9',
            'Content-Type': 'application/json',
            'Cookie': cookieHeader,
            'Origin': this.baseUrl,
            'Referer': `${this.baseUrl}/calendar/view.php?view=upcoming&course=${courseId}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );

      if (response.data && Array.isArray(response.data) && response.data[0]?.data) {
        return this.parseUpcomingEventsResponse(response.data[0].data);
      }

      return [];
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  /**
   * Parsea la respuesta JSON de eventos upcoming
   * @param data Datos de respuesta del API de SIMA
   * @returns Array de CalendarEvent
   */
  private parseUpcomingEventsResponse(data: any): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    try {
      if (data.events && Array.isArray(data.events)) {
        for (const event of data.events) {
          events.push({
            id: event.id?.toString() || '',
            name: event.name || '',
            description: event.description || '',
            timestart: parseInt(event.timestart) || 0,
            timeduration: parseInt(event.timeduration) || 0,
            course: event.course ? {
              id: event.course.id?.toString() || '',
              fullname: event.course.fullname || '',
              shortname: event.course.shortname || ''
            } : undefined,
            location: event.location || '',
            eventtype: event.eventtype || 'activity',
            url: event.url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error parsing upcoming events response:', error);
    }

    return events;
  }

  /**
   * Parsea el HTML del calendario para extraer eventos
   * @param html HTML del calendario
   * @param view Tipo de vista
   * @returns Array de CalendarEvent
   */
  private parseCalendarHTML(html: string, view: string): CalendarEvent[] {
    const $ = cheerio.load(html);
    const events: CalendarEvent[] = [];

    $('.calendar-event, .event, [data-event-id], [data-region="event-item"]').each((index, element) => {
      const $event = $(element);

      const eventId = $event.attr('data-event-id') ||
                     $event.attr('data-event') ||
                     $event.find('[data-event-id]').attr('data-event-id') ||
                     `event-${index}`;

      const name = $event.find('.event-name, .eventname, .event-title, h3, .title').first().text().trim() ||
                   $event.attr('title') ||
                   $event.text().trim().split('\n')[0];

      if (!name) return;

      const description = $event.find('.event-description, .description, .eventdescription, .content').text().trim();
      const location = $event.find('.event-location, .location, .eventlocation').text().trim();
      const timeText = $event.find('.event-time, .time, .eventtime, [data-time]').text().trim();
      const timestart = TimeParser.parseTimeToTimestamp(timeText) || 0;
      const classNames = $event.attr('class') || '';
      const eventType = EventTypeDetector.determineEventType(classNames, name);

      let activityUrl = $event.find('a').attr('href') ||
                       $event.attr('href') ||
                       $event.find('[href*="/mod/"]').attr('href') ||
                       $event.find('[href*="view.php"]').attr('href');

      if (activityUrl && !activityUrl.startsWith('http')) {
        activityUrl = activityUrl.startsWith('/') ?
          `${this.baseUrl}${activityUrl}` :
          `${this.baseUrl}/${activityUrl}`;
      }

      events.push({
        id: eventId,
        name,
        description: description || undefined,
        timestart,
        timeduration: 0,
        location: location || undefined,
        eventtype: eventType,
        url: activityUrl
      });
    });

    return events;
  }
}
