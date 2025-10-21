import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { connectDatabase, disconnectDatabase } from './utils/database';
import { authRoutes } from './routes/auth';
import { scheduleRoutes } from './routes/schedule';
import { coursesRoutes } from './routes/courses';

const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

async function start() {
  try {
    await connectDatabase();

    // CORS: permitir origen del frontend en desarrollo
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    });

    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(scheduleRoutes, { prefix: '/api' });
    await fastify.register(coursesRoutes, { prefix: '/api' });

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    fastify.get('/', async () => {
      return {
        message: 'Main API Service',
        version: '1.0.0',
        description: 'Authentication and database management service',
        endpoints: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            validate: 'GET /api/auth/validate'
          },
          courses: {
            getCourses: 'GET /api/courses',
            syncCourses: 'POST /api/courses/sync',
            getCourse: 'GET /api/courses/:courseId'
          },
          schedule: {
            getHistory: 'GET /api/schedule/history/:days',
            clearCache: 'DELETE /api/schedule/cache'
          }
        }
      };
    });

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(` Server running at http://${host}:${port}`);
    console.log(` Health check: http://${host}:${port}/health`);
    console.log(` API docs: http://${host}:${port}/`);

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n📡 Shutting down server...');
  try {
    await fastify.close();
    await disconnectDatabase();
    console.log(' Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

start();