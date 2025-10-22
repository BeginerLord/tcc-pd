import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ScraperService } from "../services/scraperService";
import { ScrapingRequest } from "../types";
import { CourseActivitiesService } from "../services/modules/courseActivitiesService";

const scraperService = new ScraperService();
const courseActivitiesService = new CourseActivitiesService();

interface ScheduleParams {
  period: "day" | "week" | "month" | "upcoming";
}

interface CourseParams {
  courseId: string;
}

export async function scrapingRoutes(fastify: FastifyInstance) {
  // Endpoint para obtener cursos del usuario
  fastify.post<{ Body: { cookies: string[] } }>(
    "/courses",
    async (
      request: FastifyRequest<{ Body: { cookies: string[] } }>,
      reply: FastifyReply
    ) => {
      try {
        const { cookies } = request.body;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Cookies array is required",
          });
        }

        const courses = await scraperService.getUserCourses(cookies);

        return reply.send({
          success: true,
          data: courses,
          count: courses.length,
        });
      } catch (error) {
        console.error("Error fetching courses:", error);
        return reply.code(500).send({
          error: "Scraping failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Endpoint para obtener el horario/calendario
  // Body: { cookies: string[], courseId?: string, date?: string }
  // date format: YYYY-MM-DD (optional, defaults to today)
  fastify.post<{ Body: ScrapingRequest; Params: ScheduleParams }>(
    "/schedule/:period",
    async (
      request: FastifyRequest<{
        Body: ScrapingRequest;
        Params: ScheduleParams;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { cookies, courseId, date } = request.body;
        const { period } = request.params;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Cookies array is required",
          });
        }

        const validPeriods = ["day", "week", "month", "upcoming"];
        if (!validPeriods.includes(period)) {
          return reply.code(400).send({
            error: "Invalid period",
            message: "Period must be one of: day, week, month, upcoming",
          });
        }

        // Log de la fecha que se está usando
        let targetDate = date || new Date().toISOString().split("T")[0];
        console.log(
          `📅 Fetching schedule for ${period}, date: ${targetDate}, courseId: ${
            courseId || "all"
          }`
        );

        let schedule = await scraperService.scrapeSchedule(
          cookies,
          period,
          courseId,
          date
        );

        // Si es "day" y no hay actividades, buscar el próximo día con actividades
        if (period === "day" && (!schedule || schedule.length === 0)) {
          console.log("📭 No activities found for today, searching for next available day...");

          const maxDaysToSearch = 30; // Buscar hasta 30 días en el futuro
          let daysChecked = 0;
          let currentDate = new Date(targetDate);

          while (daysChecked < maxDaysToSearch) {
            daysChecked++;
            currentDate.setDate(currentDate.getDate() + 1);
            const nextDateStr = currentDate.toISOString().split("T")[0];

            console.log(`🔍 Checking date: ${nextDateStr} (day ${daysChecked})`);

            const nextSchedule = await scraperService.scrapeSchedule(
              cookies,
              period,
              courseId,
              nextDateStr
            );

            if (nextSchedule && nextSchedule.length > 0) {
              console.log(`✅ Found activities on ${nextDateStr}!`);
              schedule = nextSchedule;
              targetDate = nextDateStr;
              break;
            }
          }

          if (!schedule || schedule.length === 0) {
            console.log(`⚠️ No activities found in the next ${maxDaysToSearch} days`);
          }
        }

        return reply.send({
          success: true,
          data: schedule,
          period,
          courseId: courseId || "all",
          date: targetDate,
        });
      } catch (error) {
        console.error("Error fetching schedule:", error);
        return reply.code(500).send({
          error: "Scraping failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Endpoint para obtener eventos próximos de un curso específico
  fastify.post<{ Body: { cookies: string[] }; Params: CourseParams }>(
    "/upcoming/:courseId",
    async (
      request: FastifyRequest<{
        Body: { cookies: string[] };
        Params: CourseParams;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { cookies } = request.body;
        const { courseId } = request.params;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Cookies array is required",
          });
        }

        if (!courseId) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Course ID is required",
          });
        }

        const events = await scraperService.getUpcomingEvents(
          cookies,
          courseId
        );

        return reply.send({
          success: true,
          data: events,
          courseId,
        });
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return reply.code(500).send({
          error: "Scraping failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Health check para el servicio de scraping
  fastify.get("/health", async () => {
    return {
      status: "ok",
      service: "scraping-service",
      timestamp: new Date().toISOString(),
    };
  });

  // Endpoint para obtener todas las actividades de un curso específico
  fastify.post<{ Body: { cookies: string[] }; Params: CourseParams }>(
    "/course/:courseId/activities",
    async (
      request: FastifyRequest<{
        Body: { cookies: string[] };
        Params: CourseParams;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { cookies } = request.body;
        const { courseId } = request.params;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Cookies array is required",
          });
        }

        if (!courseId) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Course ID is required",
          });
        }

        console.log(`📚 Fetching activities for course ID: ${courseId}`);
        const courseSchedule =
          await courseActivitiesService.getCourseActivities(cookies, courseId);

        return reply.send({
          success: true,
          data: courseSchedule,
        });
      } catch (error) {
        console.error("Error fetching course activities:", error);
        return reply.code(500).send({
          error: "Scraping failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Endpoint para obtener actividades de múltiples cursos
  fastify.post<{ Body: { cookies: string[]; courseIds: string[] } }>(
    "/courses/activities",
    async (
      request: FastifyRequest<{
        Body: { cookies: string[]; courseIds: string[] };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { cookies, courseIds } = request.body;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Cookies array is required",
          });
        }

        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Course IDs array is required",
          });
        }

        console.log(`📚 Fetching activities for ${courseIds.length} courses`);
        const coursesSchedules =
          await courseActivitiesService.getMultipleCoursesActivities(
            cookies,
            courseIds
          );

        return reply.send({
          success: true,
          data: coursesSchedules,
          count: coursesSchedules.length,
        });
      } catch (error) {
        console.error("Error fetching multiple course activities:", error);
        return reply.code(500).send({
          error: "Scraping failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Endpoint para obtener solo actividades con fechas de un curso
  fastify.post<{ Body: { cookies: string[] }; Params: CourseParams }>(
    "/course/:courseId/activities/dated",
    async (
      request: FastifyRequest<{
        Body: { cookies: string[] };
        Params: CourseParams;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { cookies } = request.body;
        const { courseId } = request.params;

        if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Cookies array is required",
          });
        }

        if (!courseId) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Course ID is required",
          });
        }

        console.log(`📅 Fetching dated activities for course ID: ${courseId}`);
        const activities =
          await courseActivitiesService.getCourseActivitiesWithDates(
            cookies,
            courseId
          );

        return reply.send({
          success: true,
          data: activities,
          count: activities.length,
          courseId,
        });
      } catch (error) {
        console.error("Error fetching dated course activities:", error);
        return reply.code(500).send({
          error: "Scraping failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
}
