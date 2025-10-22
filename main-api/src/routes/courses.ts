import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, IUser } from "../models/User";
import { Course } from "../models/Course";
import { CourseSchedule } from "../models/CourseSchedule";

interface AuthTokenPayload {
  userId: string;
  username: string;
}

interface CourseParams {
  courseId: string;
}

interface SyncCoursesBody {
  courses: Array<{
    id: string;
    name: string;
    shortname: string;
  }>;
}

interface SyncCourseActivitiesBody {
  courseId: string;
  courseName?: string;
  sections: Array<{
    sectionNumber: number;
    sectionName: string;
    activities: Array<{
      activityId: string;
      name: string;
      type: string;
      section: number;
      sectionName?: string;
      url?: string;
      dates?: {
        apertura?: string;
        cierre?: string;
      };
      icon?: string;
      description?: string;
    }>;
  }>;
  totalActivities: number;
}

export async function coursesRoutes(fastify: FastifyInstance) {
  async function authenticate(request: FastifyRequest): Promise<string> {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as AuthTokenPayload;
    const user = (await User.findById(decoded.userId)) as IUser | null;

    if (!user) {
      throw new Error("Invalid token");
    }

    return (user._id as mongoose.Types.ObjectId).toString();
  }

  // Obtener cursos del usuario
  fastify.get(
    "/courses",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = await authenticate(request);

        const courses = await Course.find({ userId }).sort({ name: 1 });

        return reply.send({
          success: true,
          data: courses.map((c) => ({
            id: c.courseId,
            name: c.name,
            shortname: c.shortname,
            lastSynced: c.lastSyncAt,
          })),
          count: courses.length,
        });
      } catch (error) {
        console.error("Error fetching courses:", error);
        return reply.code(401).send({
          error: "Authentication failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Sincronizar cursos (llamado desde el API Gateway)
  fastify.post<{ Body: SyncCoursesBody }>(
    "/courses/sync",
    async (
      request: FastifyRequest<{ Body: SyncCoursesBody }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = await authenticate(request);
        const { courses } = request.body;

        if (!courses || !Array.isArray(courses)) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "Courses array is required",
          });
        }

        const syncedCourses = [];

        for (const courseData of courses) {
          const course = await Course.findOneAndUpdate(
            {
              userId,
              courseId: courseData.id,
            },
            {
              userId,
              courseId: courseData.id,
              name: courseData.name,
              shortname: courseData.shortname,
              lastSyncAt: new Date(),
            },
            {
              upsert: true,
              new: true,
            }
          );

          syncedCourses.push({
            id: course.courseId,
            name: course.name,
            shortname: course.shortname,
            lastSynced: course.lastSyncAt,
          });
        }

        return reply.send({
          success: true,
          message: "Courses synced successfully",
          courses: syncedCourses,
          coursesCount: syncedCourses.length,
          count: syncedCourses.length,
        });
      } catch (error) {
        console.error("Error syncing courses:", error);
        return reply.code(500).send({
          error: "Failed to sync courses",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Obtener curso específico
  fastify.get<{ Params: CourseParams }>(
    "/courses/:courseId",
    async (
      request: FastifyRequest<{ Params: CourseParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = await authenticate(request);
        const { courseId } = request.params;

        const course = await Course.findOne({ userId, courseId });

        if (!course) {
          return reply.code(404).send({
            error: "Course not found",
            message: `No course found with ID ${courseId}`,
          });
        }

        return reply.send({
          id: course.courseId,
          name: course.name,
          shortname: course.shortname,
          lastSynced: course.lastSyncAt,
        });
      } catch (error) {
        console.error("Error fetching course:", error);
        return reply.code(500).send({
          error: "Failed to fetch course",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Sincronizar actividades de un curso
  fastify.post<{ Body: SyncCourseActivitiesBody }>(
    "/courses/activities/sync",
    async (
      request: FastifyRequest<{ Body: SyncCourseActivitiesBody }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = await authenticate(request);
        const { courseId, courseName, sections, totalActivities } =
          request.body;

        if (!courseId || !sections || !Array.isArray(sections)) {
          return reply.code(400).send({
            error: "Invalid request",
            message: "courseId and sections array are required",
          });
        }

        // Verificar que el curso existe y obtener su referencia
        const course = await Course.findOne({ userId, courseId });

        if (!course) {
          return reply.code(404).send({
            error: "Course not found",
            message: `Course with ID ${courseId} not found. Please sync courses first.`,
          });
        }

        // Mapear las actividades para usar activityId en lugar de id
        const mappedSections = sections.map((section) => ({
          ...section,
          activities: section.activities.map((activity) => ({
            activityId: activity.activityId,
            name: activity.name,
            type: activity.type,
            section: activity.section,
            sectionName: activity.sectionName,
            url: activity.url,
            dates: activity.dates,
            icon: activity.icon,
            description: activity.description,
          })),
        }));

        const courseSchedule = await CourseSchedule.findOneAndUpdate(
          {
            userId,
            courseId,
          },
          {
            userId,
            courseId,
            courseRef: course._id, // Agregar referencia al Course
            courseName,
            sections: mappedSections,
            totalActivities,
            lastSynced: new Date(),
          },
          {
            upsert: true,
            new: true,
          }
        );

        return reply.send({
          success: true,
          message: "Course activities synced successfully",
          data: {
            courseId: courseSchedule.courseId,
            courseName: courseSchedule.courseName,
            totalActivities: courseSchedule.totalActivities,
            sectionsCount: courseSchedule.sections.length,
            lastSynced: courseSchedule.lastSynced,
          },
        });
      } catch (error) {
        console.error("Error syncing course activities:", error);
        return reply.code(500).send({
          error: "Failed to sync course activities",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Obtener actividades de un curso
  fastify.get<{ Params: CourseParams }>(
    "/courses/:courseId/activities",
    async (
      request: FastifyRequest<{ Params: CourseParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = await authenticate(request);
        const { courseId } = request.params;

        const courseSchedule = await CourseSchedule.findOne({
          userId,
          courseId,
        }).populate("courseRef", "name shortname lastSyncAt");

        if (!courseSchedule) {
          return reply.code(404).send({
            error: "Course activities not found",
            message: `No activities found for course ${courseId}. Please sync first.`,
          });
        }

        return reply.send({
          success: true,
          data: {
            courseId: courseSchedule.courseId,
            courseName: courseSchedule.courseName,
            course: courseSchedule.courseRef, // Incluir información del curso relacionado
            sections: courseSchedule.sections,
            totalActivities: courseSchedule.totalActivities,
            lastSynced: courseSchedule.lastSynced,
          },
        });
      } catch (error) {
        console.error("Error fetching course activities:", error);
        return reply.code(500).send({
          error: "Failed to fetch course activities",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Obtener todas las actividades con fechas de un curso
  fastify.get<{ Params: CourseParams }>(
    "/courses/:courseId/activities/dated",
    async (
      request: FastifyRequest<{ Params: CourseParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = await authenticate(request);
        const { courseId } = request.params;

        const courseSchedule = await CourseSchedule.findOne({
          userId,
          courseId,
        }).populate("courseRef", "name shortname");

        if (!courseSchedule) {
          return reply.code(404).send({
            error: "Course activities not found",
            message: `No activities found for course ${courseId}. Please sync first.`,
          });
        }

        // Filtrar solo actividades con fechas
        const activitiesWithDates = [];
        for (const section of courseSchedule.sections) {
          for (const activity of section.activities) {
            if (
              activity.dates &&
              (activity.dates.apertura || activity.dates.cierre)
            ) {
              activitiesWithDates.push(activity);
            }
          }
        }

        return reply.send({
          success: true,
          data: activitiesWithDates,
          count: activitiesWithDates.length,
          courseId: courseSchedule.courseId,
          courseName: courseSchedule.courseName,
          course: courseSchedule.courseRef, // Incluir información del curso relacionado
        });
      } catch (error) {
        console.error("Error fetching dated course activities:", error);
        return reply.code(500).send({
          error: "Failed to fetch dated course activities",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
}
