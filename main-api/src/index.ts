import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
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

    // Swagger configuration
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Main API',
          description: 'Authentication and database management service for TCC-PD',
          version: '1.0.0'
        },
        servers: [
          {
            url: `http://localhost:${process.env.PORT || 3000}`,
            description: 'Development server'
          }
        ],
        tags: [
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'courses', description: 'Course management endpoints' },
          { name: 'schedule', description: 'Schedule management endpoints' },
          { name: 'health', description: 'Health check endpoints' }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      }
    });

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      },
      staticCSP: true
    });

    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(scheduleRoutes, { prefix: '/api' });
    await fastify.register(coursesRoutes, { prefix: '/api' });

    fastify.get('/health', {
      schema: {
        tags: ['health'],
        description: 'Health check endpoint',
        response: {
          200: {
            description: 'Service is healthy',
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }, async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    fastify.get('/', {
      schema: {
        tags: ['health'],
        description: 'API information and available endpoints',
        response: {
          200: {
            description: 'API information',
            type: 'object',
            properties: {
              message: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              endpoints: {
                type: 'object',
                properties: {
                  auth: {
                    type: 'object',
                    properties: {
                      register: { type: 'string' },
                      login: { type: 'string' },
                      validate: { type: 'string' }
                    }
                  },
                  courses: {
                    type: 'object',
                    properties: {
                      getCourses: { type: 'string' },
                      syncCourses: { type: 'string' },
                      getCourse: { type: 'string' }
                    }
                  },
                  schedule: {
                    type: 'object',
                    properties: {
                      getHistory: { type: 'string' },
                      clearCache: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }, async () => {
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
    console.log(` Swagger UI: http://${host}:${port}/docs`);

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