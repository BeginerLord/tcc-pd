import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ScraperService } from '../services/scraperService';
import { ScrapingRequest } from '../types';

const scraperService = new ScraperService();

interface ScheduleParams {
  period: 'day' | 'week' | 'month' | 'upcoming';
}

interface CourseParams {
  courseId: string;
}

export async function scrapingRoutes(fastify: FastifyInstance) {
  // Endpoint para obtener cursos del usuario
  fastify.post<{ Body: { cookies: string[] } }>(
    '/courses',
    async (request: FastifyRequest<{ Body: { cookies: string[] } }>, reply: FastifyReply) => {
      try {
        const { cookies } = request.body;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: 'Invalid request',
            message: 'Cookies array is required'
          });
        }

        const courses = await scraperService.getUserCourses(cookies);

        return reply.send({
          success: true,
          data: courses,
          count: courses.length
        });
      } catch (error) {
        console.error('Error fetching courses:', error);
        return reply.code(500).send({
          error: 'Scraping failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Endpoint para obtener el horario/calendario
  // Body: { cookies: string[], courseId?: string, date?: string }
  // date format: YYYY-MM-DD (optional, defaults to today)
  fastify.post<{ Body: ScrapingRequest; Params: ScheduleParams }>(
    '/schedule/:period',
    async (request: FastifyRequest<{ Body: ScrapingRequest; Params: ScheduleParams }>, reply: FastifyReply) => {
      try {
        const { cookies, courseId, date } = request.body;
        const { period } = request.params;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: 'Invalid request',
            message: 'Cookies array is required'
          });
        }

        const validPeriods = ['day', 'week', 'month', 'upcoming'];
        if (!validPeriods.includes(period)) {
          return reply.code(400).send({
            error: 'Invalid period',
            message: 'Period must be one of: day, week, month, upcoming'
          });
        }

        // Log de la fecha que se está usando
        const targetDate = date || new Date().toISOString().split('T')[0];
        console.log(`📅 Fetching schedule for ${period}, date: ${targetDate}, courseId: ${courseId || 'all'}`);

        const schedule = await scraperService.scrapeSchedule(cookies, period, courseId, date);

        return reply.send({
          success: true,
          data: schedule,
          period,
          courseId: courseId || 'all',
          date: targetDate
        });
      } catch (error) {
        console.error('Error fetching schedule:', error);
        return reply.code(500).send({
          error: 'Scraping failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Endpoint para obtener eventos próximos de un curso específico
  fastify.post<{ Body: { cookies: string[] }; Params: CourseParams }>(
    '/upcoming/:courseId',
    async (request: FastifyRequest<{ Body: { cookies: string[] }; Params: CourseParams }>, reply: FastifyReply) => {
      try {
        const { cookies } = request.body;
        const { courseId } = request.params;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: 'Invalid request',
            message: 'Cookies array is required'
          });
        }

        if (!courseId) {
          return reply.code(400).send({
            error: 'Invalid request',
            message: 'Course ID is required'
          });
        }

        const events = await scraperService.getUpcomingEvents(cookies, courseId);

        return reply.send({
          success: true,
          data: events,
          courseId
        });
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
        return reply.code(500).send({
          error: 'Scraping failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Health check para el servicio de scraping
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'scraping-service',
      timestamp: new Date().toISOString()
    };
  });
}
