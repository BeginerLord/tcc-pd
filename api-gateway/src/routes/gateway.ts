import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ServiceProxy } from "../utils/serviceProxy";
import { authMiddleware } from "../middleware/auth";

const serviceProxy = new ServiceProxy();

export async function gatewayRoutes(fastify: FastifyInstance) {
  // ============================================
  // RUTAS DE AUTENTICACIÓN (sin middleware)
  // ============================================

  fastify.post(
    "/auth/register",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/register",
          "POST",
          request.body
        );
        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Registration failed",
          message: error.message,
        });
      }
    }
  );

  fastify.post(
    "/auth/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/login",
          "POST",
          request.body
        );
        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Login failed",
          message: error.message,
        });
      }
    }
  );

  // ============================================
  // RUTAS PROTEGIDAS CON AUTENTICACIÓN
  // ============================================

  // Validar token
  fastify.get(
    "/auth/validate",
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/validate",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );
        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Validation failed",
          message: error.message,
        });
      }
    }
  );

  // ============================================
  // RUTAS DE CURSOS
  // ============================================

  // Obtener cursos (main-api - desde BD)
  fastify.get(
    "/courses",
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/courses",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );
        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get courses",
          message: error.message,
        });
      }
    }
  );

  // Obtener curso específico
  fastify.get<{ Params: { courseId: string } }>(
    "/courses/:courseId",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { courseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;
        const authHeader = request.headers.authorization;
        const result = await serviceProxy.proxyRequest(
          "main",
          `/api/courses/${courseId}`,
          "GET",
          undefined,
          { Authorization: authHeader! }
        );
        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get course",
          message: error.message,
        });
      }
    }
  );

  // Sincronizar cursos desde SIMA (usa scraping-service)
  fastify.post(
    "/courses/sync",
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;

        // 1. Obtener cookies del usuario desde main-api
        const userInfo = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/validate",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        if (!userInfo.user?.cookies) {
          return reply.code(400).send({
            error: "No cookies found",
            message: "User must login to SIMA first",
          });
        }

        // 2. Llamar al scraping-service para obtener cursos
        const scrapedCourses = await serviceProxy.proxyRequest(
          "scraping",
          "/api/scraping/courses",
          "POST",
          { cookies: userInfo.user.cookies }
        );

        // 3. Guardar cursos en main-api
        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/courses/sync",
          "POST",
          { courses: scrapedCourses.data },
          { Authorization: authHeader! }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Sync failed",
          message: error.message,
        });
      }
    }
  );

  // ============================================
  // RUTAS DE ACTIVIDADES DE CURSOS
  // ============================================

  // Obtener actividades de un curso desde la BD
  fastify.get<{ Params: { courseId: string } }>(
    "/courses/:courseId/activities",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { courseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;
        const authHeader = request.headers.authorization;

        const result = await serviceProxy.proxyRequest(
          "main",
          `/api/courses/${courseId}/activities`,
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get course activities",
          message: error.message,
        });
      }
    }
  );

  // Obtener solo actividades con fechas de un curso
  fastify.get<{ Params: { courseId: string } }>(
    "/courses/:courseId/activities/dated",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { courseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;
        const authHeader = request.headers.authorization;

        const result = await serviceProxy.proxyRequest(
          "main",
          `/api/courses/${courseId}/activities/dated`,
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get dated activities",
          message: error.message,
        });
      }
    }
  );

  // Sincronizar actividades de un curso (scraping + guardar)
  fastify.post<{ Params: { courseId: string } }>(
    "/courses/:courseId/activities/sync",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { courseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;
        const authHeader = request.headers.authorization;

        // 1. Obtener cookies del usuario
        const userInfo = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/validate",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        if (!userInfo.user?.cookies) {
          return reply.code(400).send({
            error: "No cookies found",
            message: "User must login to SIMA first",
          });
        }

        // 2. Obtener actividades desde scraping-service
        const scrapedActivities = await serviceProxy.proxyRequest(
          "scraping",
          `/api/scraping/course/${courseId}/activities`,
          "POST",
          { cookies: userInfo.user.cookies }
        );

        if (!scrapedActivities.success || !scrapedActivities.data) {
          return reply.code(400).send({
            error: "Failed to scrape activities",
            message: "Could not retrieve activities from SIMA",
          });
        }

        // 3. Mapear los datos al formato que espera el main-api
        const courseScheduleData = {
          courseId: scrapedActivities.data.courseId,
          courseName: scrapedActivities.data.courseName,
          sections: scrapedActivities.data.sections.map((section: any) => ({
            sectionNumber: section.sectionNumber,
            sectionName: section.sectionName,
            activities: section.activities.map((activity: any) => ({
              activityId: activity.id,
              name: activity.name,
              type: activity.type,
              section: activity.section,
              sectionName: activity.sectionName,
              url: activity.url,
              dates: activity.dates,
              icon: activity.icon,
              description: activity.description,
            })),
          })),
          totalActivities: scrapedActivities.data.totalActivities,
        };

        // 4. Guardar en main-api
        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/courses/activities/sync",
          "POST",
          courseScheduleData,
          { Authorization: authHeader! }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Sync failed",
          message: error.message,
        });
      }
    }
  );

  // Obtener actividades directamente desde SIMA (sin guardar)
  fastify.post<{ Params: { courseId: string } }>(
    "/courses/:courseId/activities/scrape",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { courseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;
        const authHeader = request.headers.authorization;

        // 1. Obtener cookies del usuario
        const userInfo = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/validate",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        if (!userInfo.user?.cookies) {
          return reply.code(400).send({
            error: "No cookies found",
            message: "User must login to SIMA first",
          });
        }

        // 2. Obtener actividades desde scraping-service
        const result = await serviceProxy.proxyRequest(
          "scraping",
          `/api/scraping/course/${courseId}/activities`,
          "POST",
          { cookies: userInfo.user.cookies }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to scrape activities",
          message: error.message,
        });
      }
    }
  );

  // ============================================
  // RUTAS DE HORARIO/CALENDARIO
  // ============================================

  // Obtener horario por período
  // Query params: ?date=YYYY-MM-DD (optional, defaults to today)
  fastify.get<{
    Params: { period: string };
    Querystring: { date?: string; courseId?: string };
  }>(
    "/schedule/:period",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{
        Params: { period: string };
        Querystring: { date?: string; courseId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { period } = request.params;
        const { date, courseId } = request.query;
        const authHeader = request.headers.authorization;

        // 1. Obtener cookies del usuario
        const userInfo = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/validate",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        if (!userInfo.user?.cookies) {
          return reply.code(400).send({
            error: "No cookies found",
            message: "User must login to SIMA first",
          });
        }

        // 2. Obtener horario desde scraping-service
        const requestBody: any = { cookies: userInfo.user.cookies };
        if (date) requestBody.date = date;
        if (courseId) requestBody.courseId = courseId;

        const schedule = await serviceProxy.proxyRequest(
          "scraping",
          `/api/scraping/schedule/${period}`,
          "POST",
          requestBody
        );

        return reply.send(schedule);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get schedule",
          message: error.message,
        });
      }
    }
  );

  // Obtener historial de horarios
  fastify.get<{ Params: { days: string } }>(
    "/schedule/history/:days",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { days: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { days } = request.params;
        const authHeader = request.headers.authorization;

        const result = await serviceProxy.proxyRequest(
          "main",
          `/api/schedule/history/${days}`,
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get history",
          message: error.message,
        });
      }
    }
  );

  // Obtener eventos próximos de un curso
  fastify.get<{ Params: { courseId: string } }>(
    "/schedule/upcoming/:courseId",
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { courseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;
        const authHeader = request.headers.authorization;

        // 1. Obtener cookies del usuario
        const userInfo = await serviceProxy.proxyRequest(
          "main",
          "/api/auth/validate",
          "GET",
          undefined,
          { Authorization: authHeader! }
        );

        if (!userInfo.user?.cookies) {
          return reply.code(400).send({
            error: "No cookies found",
            message: "User must login to SIMA first",
          });
        }

        // 2. Obtener eventos desde scraping-service
        const events = await serviceProxy.proxyRequest(
          "scraping",
          `/api/scraping/upcoming/${courseId}`,
          "POST",
          { cookies: userInfo.user.cookies }
        );

        return reply.send(events);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to get upcoming events",
          message: error.message,
        });
      }
    }
  );

  // Limpiar caché de horarios
  fastify.delete(
    "/schedule/cache",
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;

        const result = await serviceProxy.proxyRequest(
          "main",
          "/api/schedule/cache",
          "DELETE",
          undefined,
          { Authorization: authHeader! }
        );

        return reply.send(result);
      } catch (error: any) {
        return reply.code(error.status || 500).send({
          error: "Failed to clear cache",
          message: error.message,
        });
      }
    }
  );

  // ============================================
  // HEALTH CHECK
  // ============================================

  fastify.get(
    "/health",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const mainHealth = await serviceProxy.checkServiceHealth("main");
      const scrapingHealth = await serviceProxy.checkServiceHealth("scraping");

      return reply.send({
        status: "ok",
        gateway: "running",
        services: {
          main: mainHealth ? "healthy" : "unhealthy",
          scraping: scrapingHealth ? "healthy" : "unhealthy",
        },
        timestamp: new Date().toISOString(),
      });
    }
  );
}
