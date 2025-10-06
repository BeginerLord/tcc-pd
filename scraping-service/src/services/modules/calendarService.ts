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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1'
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => {
          // Aceptar códigos de estado 2xx y 3xx
          return status >= 200 && status < 400;
        }
      });

      // Verificar si fue redirigido al login
      if (response.request?.path?.includes('/login') || response.data.includes('loginform')) {
        throw new Error('Session expired or invalid cookies. Please login again.');
      }

      // DEBUG: Guardar HTML para inspección
      if (view === 'day') {
        const fs = require('fs');
        const path = require('path');
        const debugPath = path.join(__dirname, '../../../debug-day-view.html');
        fs.writeFileSync(debugPath, response.data, 'utf-8');
        console.log(`🔍 DEBUG: HTML guardado en ${debugPath}`);
      }

      return this.parseCalendarHTML(response.data, view, date);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_FR_TOO_MANY_REDIRECTS' || error.message.includes('redirect')) {
          throw new Error('Session expired or invalid cookies. Too many redirects - please login again.');
        }
        if (error.response?.status === 303 || error.response?.status === 302) {
          throw new Error('Session expired. Please login again.');
        }
      }
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
   * @param date Fecha específica (opcional)
   * @returns Array de CalendarEvent
   */
  private parseCalendarHTML(html: string, view: string, date?: string): CalendarEvent[] {
    const $ = cheerio.load(html);
    const events: CalendarEvent[] = [];

    // Si es vista de día, detectar qué formato nos devolvió SIMA
    if (view === 'day') {
      // Verificar si es formato timeline o formato mensual
      const hasTimelineWrapper = $('[data-region="event-list-wrapper"]').length > 0;
      const hasMonthCalendar = $('td.day[data-day]').length > 0;

      console.log(`🔍 Day view format detection: timeline=${hasTimelineWrapper}, month=${hasMonthCalendar}`);

      if (hasTimelineWrapper) {
        console.log('📅 Using timeline parser');
        return this.parseDayViewHTML($, html, date);
      } else if (hasMonthCalendar && date) {
        console.log('📅 Using month calendar parser for specific day');
        return this.parseDayEventsFromMonthView($, html, date);
      } else {
        console.log('⚠️ Could not detect day view format, trying alternative parsing');
        return this.parseAlternativeDayView($, html);
      }
    }

    // Parsing para otras vistas (month, week, etc)
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

  /**
   * Parsea el HTML específico de la vista de día (timeline)
   * @param $ Cheerio instance
   * @param html HTML completo
   * @param requestedDate Fecha solicitada en formato YYYY-MM-DD (opcional)
   * @returns Array de CalendarEvent
   */
  private parseDayViewHTML($: cheerio.CheerioAPI, html: string, requestedDate?: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    console.log('=== DEBUG: Parsing Day View HTML ===');
    if (requestedDate) {
      console.log(`📅 Filtering events for specific date: ${requestedDate}`);
    }

    // Intentar múltiples selectores para encontrar los eventos
    const wrapperSelectors = [
      '[data-region="event-list-wrapper"]',
      '.edw-timeline-event-list',
      '[data-region="event-list-content"]',
      '.timeline-event-list'
    ];

    let $wrapper: any = null;
    for (const selector of wrapperSelectors) {
      $wrapper = $(selector);
      if ($wrapper.length > 0) {
        console.log(`Found wrapper with selector: ${selector}`);
        break;
      }
    }

    if (!$wrapper || $wrapper.length === 0) {
      console.log('No event wrapper found. Trying alternative parsing...');
      return this.parseAlternativeDayView($, html);
    }

    // Buscar todas las secciones de eventos por fecha
    const dateItemSelectors = [
      '.edw-timeline-event-list-item',
      '[data-region="day-content"]',
      '.timeline-event-list-item-wrapper'
    ];

    let $dateSections: any = null;
    for (const selector of dateItemSelectors) {
      $dateSections = $wrapper.find(selector);
      if ($dateSections.length > 0) {
        console.log(`Found ${$dateSections.length} date sections with selector: ${selector}`);
        break;
      }
    }

    if (!$dateSections || $dateSections.length === 0) {
      console.log('No date sections found');
      return [];
    }

    $dateSections.each((_: any, dateSection: any) => {
      const $dateSection = $(dateSection);

      // Extraer la fecha de la sección
      const dateText = $dateSection.find('[data-region="event-list-content-date"] h5').text().trim() ||
                      $dateSection.find('h5').first().text().trim();
      const dateTimestamp = $dateSection.find('[data-region="event-list-content-date"]').attr('data-timestamp');

      console.log(`Processing date section: ${dateText} (timestamp: ${dateTimestamp})`);

      // Si se especificó una fecha, filtrar por timestamp
      if (requestedDate && dateTimestamp) {
        const requestedTimestamp = Math.floor(new Date(requestedDate).getTime() / 1000);
        const sectionTimestamp = parseInt(dateTimestamp);

        // Comparar solo la parte de la fecha (ignorar horas)
        const requestedDateOnly = Math.floor(requestedTimestamp / 86400);
        const sectionDateOnly = Math.floor(sectionTimestamp / 86400);

        if (requestedDateOnly !== sectionDateOnly) {
          console.log(`⏭️ Skipping date section (requested: ${requestedDateOnly}, section: ${sectionDateOnly})`);
          return; // Skip this date section
        }
        console.log(`✅ Date section matches requested date`);
      }

      // Iterar sobre cada evento en esta fecha
      const eventSelectors = [
        '[data-region="event-list-item"]',
        '.list-group-item',
        '.timeline-event-list-item'
      ];

      let $events: any = null;
      for (const selector of eventSelectors) {
        $events = $dateSection.find(selector);
        if ($events.length > 0) {
          console.log(`Found ${$events.length} events with selector: ${selector}`);
          break;
        }
      }

      if (!$events || $events.length === 0) {
        console.log('No events found in this date section');
        return;
      }

      $events.each((index: any, eventElement: any) => {
        const $event = $(eventElement);

        // Extraer información del evento
        const $eventNameLink = $event.find('.event-name a');
        const eventName = $eventNameLink.text().trim();
        const eventUrl = $eventNameLink.attr('href');
        const eventTitle = $eventNameLink.attr('title'); // "Vencimiento de Protocolo individual..."

        // Extraer el curso completo
        const courseName = $event.find('.coursename-action .h-regular-6').text().trim();

        // Extraer el tipo de acción (ej: "Vencimiento de Tarea")
        const actionText = $event.find('.coursename-action').text().trim();
        const actionType = actionText.replace(courseName, '').replace('-', '').trim();

        // Extraer la hora
        const timeText = $event.find('.small-info-text').text().trim();

        // Extraer el icono/tipo de actividad
        const activityIcon = $event.find('.activityiconcontainer img').attr('title') ||
                           $event.find('.activityiconcontainer img').attr('alt') ||
                           'Evento de actividad';

        // Extraer el botón de acción y su URL
        const actionButton = $event.find('.timeline-action-button a');
        const actionButtonText = actionButton.text().trim(); // "Agregar entrega"
        const actionButtonUrl = actionButton.attr('href');

        // Construir el timestamp completo si tenemos fecha y hora
        let eventTimestamp = 0;
        if (dateTimestamp && timeText) {
          const baseTimestamp = parseInt(dateTimestamp);
          const [hours, minutes] = timeText.split(':').map(n => parseInt(n) || 0);
          eventTimestamp = baseTimestamp + (hours * 3600) + (minutes * 60);
        }

        // Construir URL completa si es relativa
        let fullEventUrl = eventUrl;
        if (fullEventUrl && !fullEventUrl.startsWith('http')) {
          fullEventUrl = fullEventUrl.startsWith('/') ?
            `${this.baseUrl}${fullEventUrl}` :
            `${this.baseUrl}/${fullEventUrl}`;
        }

        let fullActionUrl = actionButtonUrl;
        if (fullActionUrl && !fullActionUrl.startsWith('http')) {
          fullActionUrl = fullActionUrl.startsWith('/') ?
            `${this.baseUrl}${fullActionUrl}` :
            `${this.baseUrl}/${fullActionUrl}`;
        }

        // Solo agregar si tiene nombre
        if (eventName) {
          console.log(`Adding event: ${eventName} at ${timeText}`);
          events.push({
            id: fullEventUrl?.match(/id=(\d+)/)?.[1] || `event-${Date.now()}-${index}`,
            name: eventName,
            description: eventTitle || actionType,
            timestart: eventTimestamp,
            timeduration: 0,
            course: courseName ? {
              id: fullEventUrl?.match(/course=(\d+)/)?.[1] || '',
              fullname: courseName,
              shortname: courseName.split('-').pop()?.trim() || courseName
            } : undefined,
            location: undefined,
            eventtype: this.mapActionTypeToEventType(actionType, activityIcon),
            url: fullEventUrl,
            metadata: {
              date: dateText,
              time: timeText,
              actionType: actionType,
              actionButton: actionButtonText,
              actionButtonUrl: fullActionUrl,
              activityIcon: activityIcon
            }
          });
        } else {
          console.log(`Skipping event without name at index ${index}`);
        }
      });
    });

    console.log(`Total events found: ${events.length}`);
    return events;
  }

  /**
   * Método alternativo de parsing cuando los selectores principales no funcionan
   * @param $ Cheerio instance
   * @param html HTML completo
   * @returns Array de CalendarEvent
   */
  private parseAlternativeDayView($: cheerio.CheerioAPI, html: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    console.log('=== Using alternative day view parsing ===');

    // Buscar todos los elementos que podrían ser eventos
    $('.list-group-item, [data-region="event-list-item"], .timeline-event-list-item').each((index: any, element: any) => {
      const $event = $(element);

      // Verificar que tiene las características de un evento
      const hasActivityIcon = $event.find('.activityiconcontainer').length > 0;
      const hasEventName = $event.find('.event-name, h6').length > 0;

      if (!hasActivityIcon && !hasEventName) {
        return; // Skip
      }

      console.log(`Processing alternative event ${index}`);

      // Extraer nombre del evento
      const eventName = $event.find('.event-name a, h6 a').first().text().trim() ||
                       $event.find('h6').first().text().trim();

      if (!eventName) {
        console.log(`No event name found for event ${index}`);
        return;
      }

      const eventUrl = $event.find('.event-name a, h6 a').first().attr('href');
      const eventTitle = $event.find('.event-name a, h6 a').first().attr('title');

      // Extraer curso
      const courseName = $event.find('.coursename-action span, .h-regular-6').first().text().trim();

      // Extraer tipo de acción
      const actionText = $event.find('.coursename-action').text().trim();
      const actionType = actionText.replace(courseName, '').replace('-', '').trim();

      // Extraer hora
      const timeText = $event.find('.small-info-text, small').first().text().trim();

      // Extraer icono
      const activityIcon = $event.find('.activityiconcontainer img').attr('title') ||
                         $event.find('.activityiconcontainer img').attr('alt') ||
                         'Evento de actividad';

      // Extraer botón de acción
      const actionButton = $event.find('.timeline-action-button a, .event-action a');
      const actionButtonText = actionButton.text().trim();
      const actionButtonUrl = actionButton.attr('href');

      // Construir URLs completas
      let fullEventUrl = eventUrl;
      if (fullEventUrl && !fullEventUrl.startsWith('http')) {
        fullEventUrl = fullEventUrl.startsWith('/') ?
          `${this.baseUrl}${fullEventUrl}` :
          `${this.baseUrl}/${fullEventUrl}`;
      }

      let fullActionUrl = actionButtonUrl;
      if (fullActionUrl && !fullActionUrl.startsWith('http')) {
        fullActionUrl = fullActionUrl.startsWith('/') ?
          `${this.baseUrl}${fullActionUrl}` :
          `${this.baseUrl}/${fullActionUrl}`;
      }

      console.log(`Alternative parsing found: ${eventName} at ${timeText}`);

      events.push({
        id: fullEventUrl?.match(/id=(\d+)/)?.[1] || `event-alt-${Date.now()}-${index}`,
        name: eventName,
        description: eventTitle || actionType,
        timestart: 0, // No timestamp available in alternative parsing
        timeduration: 0,
        course: courseName ? {
          id: fullEventUrl?.match(/course=(\d+)/)?.[1] || '',
          fullname: courseName,
          shortname: courseName.split('-').pop()?.trim() || courseName
        } : undefined,
        location: undefined,
        eventtype: this.mapActionTypeToEventType(actionType, activityIcon),
        url: fullEventUrl,
        metadata: {
          date: undefined,
          time: timeText,
          actionType: actionType,
          actionButton: actionButtonText,
          actionButtonUrl: fullActionUrl,
          activityIcon: activityIcon
        }
      });
    });

    console.log(`Alternative parsing found ${events.length} events`);
    return events;
  }

  /**
   * Parsea eventos de un día específico desde la vista mensual
   * @param $ Cheerio instance
   * @param html HTML completo
   * @param date Fecha en formato YYYY-MM-DD
   * @returns Array de CalendarEvent
   */
  private parseDayEventsFromMonthView($: cheerio.CheerioAPI, html: string, date?: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    if (!date) {
      console.log('❌ No date provided for day view');
      return events;
    }

    // Extraer el día del mes de la fecha (evitar problemas de zona horaria)
    const dateParts = date.split('-'); // YYYY-MM-DD
    const dayOfMonth = dateParts[2]; // Día del mes como string (ej: "11")
    console.log(`🔍 Looking for events on day ${dayOfMonth} in month view (date: ${date})`);

    // Buscar la celda del día específico - probar múltiples selectores
    let $dayCell = $(`td.day[data-day="${dayOfMonth}"]`);

    console.log(`🔍 Searching with selector: td.day[data-day="${dayOfMonth}"]`);
    console.log(`📊 Found ${$dayCell.length} matching day cells`);

    // Si no encontramos, buscar en todas las celdas de día
    if ($dayCell.length === 0) {
      console.log('⚠️ Trying alternative selectors...');
      $dayCell = $(`td[data-day="${dayOfMonth}"]`);
      console.log(`📊 Alternative search found ${$dayCell.length} cells`);
    }

    if ($dayCell.length === 0) {
      console.log(`❌ Day cell not found for day ${dayOfMonth}`);
      console.log('🔍 Available day cells:', $('td[data-day]').map((i, el) => $(el).attr('data-day')).get().join(', '));
      return events;
    }

    console.log(`✅ Found day cell for day ${dayOfMonth}`);

    // Buscar todos los eventos dentro de esa celda
    $dayCell.find('[data-region="event-item"]').each((index, element) => {
      const $event = $(element);

      const eventId = $event.find('a[data-event-id]').attr('data-event-id') || `event-${index}`;
      const eventLink = $event.find('a[data-action="view-event"]');
      const eventName = eventLink.find('.eventname').text().trim();
      const eventUrl = eventLink.attr('href');
      const eventTitle = eventLink.attr('title');

      const eventComponent = $event.attr('data-event-component');
      const eventType = $event.attr('data-event-eventtype');

      if (!eventName) {
        console.log(`Skipping event ${index} - no name found`);
        return;
      }

      console.log(`Found event: ${eventName} (ID: ${eventId})`);

      events.push({
        id: eventId,
        name: eventName,
        description: eventTitle || '',
        timestart: 0, // Timestamp no disponible en vista mensual
        timeduration: 0,
        eventtype: eventComponent?.replace('mod_', '') || eventType || 'activity',
        url: eventUrl || '',
        metadata: {
          component: eventComponent,
          eventtype: eventType
        }
      });
    });

    console.log(`📊 Total events found for day ${dayOfMonth}: ${events.length}`);
    return events;
  }

  /**
   * Mapea el tipo de acción a un tipo de evento estándar
   * @param actionType Tipo de acción (ej: "Vencimiento de Tarea")
   * @param activityIcon Icono de la actividad
   * @returns Tipo de evento
   */
  private mapActionTypeToEventType(actionType: string, activityIcon: string): string {
    const lowerAction = actionType.toLowerCase();
    const lowerIcon = activityIcon.toLowerCase();

    if (lowerAction.includes('tarea') || lowerIcon.includes('assign')) {
      return 'assign';
    }
    if (lowerAction.includes('cuestionario') || lowerIcon.includes('quiz')) {
      return 'quiz';
    }
    if (lowerAction.includes('foro') || lowerIcon.includes('forum')) {
      return 'forum';
    }
    if (lowerAction.includes('examen') || lowerIcon.includes('exam')) {
      return 'exam';
    }

    return 'activity';
  }
}
