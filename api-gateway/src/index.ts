import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { gatewayRoutes } from './routes/gateway';

const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

async function start() {
  try {
    // Seguridad
    await fastify.register(helmet);

    // CORS
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    });

    // Rate limiting
    await fastify.register(rateLimit, {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      timeWindow: '15 minutes'
    });

    // Registrar rutas del gateway
    await fastify.register(gatewayRoutes, { prefix: '/api' });

    // Root endpoint
    fastify.get('/', async () => {
      return {
        service: 'API Gateway',
        version: '1.0.0',
        description: 'Gateway para sistema distribuido SIMA Scraper',
        architecture: {
          gateway: 'Central router and orchestrator',
          services: {
            main: 'Authentication, database, business logic',
            scraping: 'Web scraping operations'
          }
        },
        endpoints: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            validate: 'GET /api/auth/validate (protected)'
          },
          courses: {
            list: 'GET /api/courses (protected)',
            get: 'GET /api/courses/:courseId (protected)',
            sync: 'POST /api/courses/sync (protected)'
          },
          schedule: {
            getSchedule: 'GET /api/schedule/:period (protected)',
            getHistory: 'GET /api/schedule/history/:days (protected)',
            getUpcoming: 'GET /api/schedule/upcoming/:courseId (protected)',
            clearCache: 'DELETE /api/schedule/cache (protected)'
          },
          health: 'GET /api/health'
        }
      };
    });

    const port = parseInt(process.env.GATEWAY_PORT || '8080');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(` API Gateway running at http://${host}:${port}`);
    console.log(` Health check: http://${host}:${port}/api/health`);
    console.log(` API docs: http://${host}:${port}/`);
    console.log(`\n Connected services:`);
    console.log(`   - Main API: ${process.env.MAIN_API_URL || 'http://localhost:3000'}`);
    console.log(`   - Scraping Service: ${process.env.SCRAPING_SERVICE_URL || 'http://localhost:3001'}`);

  } catch (error) {
    console.error('❌ Error starting API Gateway:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n📡 Shutting down API Gateway...');
  try {
    await fastify.close();
    console.log('✅ API Gateway shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

start();
