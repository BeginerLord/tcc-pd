import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Course } from '../models/Course';

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

export async function coursesRoutes(fastify: FastifyInstance) {

  async function authenticate(request: FastifyRequest): Promise<string> {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AuthTokenPayload;
    const user = await User.findById(decoded.userId) as IUser | null;

    if (!user) {
      throw new Error('Invalid token');
    }

    return (user._id as mongoose.Types.ObjectId).toString();
  }

  // Obtener cursos del usuario
  fastify.get(
    '/courses',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = await authenticate(request);

        const courses = await Course.find({ userId }).sort({ name: 1 });

        return reply.send({
          courses: courses.map(c => ({
            id: c.courseId,
            name: c.name,
            shortname: c.shortname,
            lastSynced: c.lastSyncAt
          })),
          count: courses.length
        });

      } catch (error) {
        console.error('Error fetching courses:', error);
        return reply.code(401).send({
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Sincronizar cursos (llamado desde el API Gateway)
  fastify.post<{ Body: SyncCoursesBody }>(
    '/courses/sync',
    async (request: FastifyRequest<{ Body: SyncCoursesBody }>, reply: FastifyReply) => {
      try {
        const userId = await authenticate(request);
        const { courses } = request.body;

        if (!courses || !Array.isArray(courses)) {
          return reply.code(400).send({
            error: 'Invalid request',
            message: 'Courses array is required'
          });
        }

        const syncedCourses = [];

        for (const courseData of courses) {
          const course = await Course.findOneAndUpdate(
            {
              userId,
              courseId: courseData.id
            },
            {
              userId,
              courseId: courseData.id,
              name: courseData.name,
              shortname: courseData.shortname,
              lastSyncAt: new Date()
            },
            {
              upsert: true,
              new: true
            }
          );

          syncedCourses.push({
            id: course.courseId,
            name: course.name,
            shortname: course.shortname,
            lastSynced: course.lastSyncAt
          });
        }

        return reply.send({
          message: 'Courses synced successfully',
          courses: syncedCourses,
          count: syncedCourses.length
        });

      } catch (error) {
        console.error('Error syncing courses:', error);
        return reply.code(500).send({
          error: 'Failed to sync courses',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Obtener curso específico
  fastify.get<{ Params: CourseParams }>(
    '/courses/:courseId',
    async (request: FastifyRequest<{ Params: CourseParams }>, reply: FastifyReply) => {
      try {
        const userId = await authenticate(request);
        const { courseId } = request.params;

        const course = await Course.findOne({ userId, courseId });

        if (!course) {
          return reply.code(404).send({
            error: 'Course not found',
            message: `No course found with ID ${courseId}`
          });
        }

        return reply.send({
          id: course.courseId,
          name: course.name,
          shortname: course.shortname,
          lastSynced: course.lastSyncAt
        });

      } catch (error) {
        console.error('Error fetching course:', error);
        return reply.code(500).send({
          error: 'Failed to fetch course',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}
