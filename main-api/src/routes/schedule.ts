import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AuthService } from '../services/authService';
import { User, IUser } from '../models/User';
import { Schedule } from '../models/Schedule';
import { decrypt } from '../utils/crypto';

interface AuthTokenPayload {
  userId: string;
  username: string;
}

interface HistoryParams {
  days: string;
}

export async function scheduleRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  async function authenticate(request: FastifyRequest): Promise<{ userId: string; cookies: string[] }> {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AuthTokenPayload;
    const user = await User.findById(decoded.userId) as IUser | null;

    if (!user) {
      throw new Error('Invalid token');
    }

    let activeSession = user.sessions.find(s =>
      s.isActive && s.expiresAt > new Date()
    );

    if (!activeSession || !(await authService.validateSession(activeSession.cookies))) {
      const simaLoginResult = await authService.login({
        username: user.simaCredentials.username,
        password: decrypt(user.simaCredentials.encryptedPassword)
      });

      activeSession = {
        cookies: simaLoginResult.cookies || [],
        loginToken: simaLoginResult.sessionData?.loginToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      };

      user.sessions = user.sessions.filter(s => s.isActive && s.expiresAt > new Date());
      user.sessions.push(activeSession);
      await user.save();
    }

    return {
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      cookies: activeSession.cookies
    };
  }

  // Obtener historial de horarios guardados
  fastify.get<{ Params: HistoryParams }>(
    '/schedule/history/:days',
    {
      schema: {
        tags: ['schedule'],
        description: 'Get schedule history for the specified number of days',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['days'],
          properties: {
            days: {
              type: 'string',
              description: 'Number of days to look back (1-365)',
              pattern: '^[0-9]+$'
            }
          }
        },
        response: {
          200: {
            description: 'Schedule history',
            type: 'object',
            properties: {
              days: { type: 'number' },
              count: { type: 'number' },
              schedules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    courseId: { type: 'string' },
                    date: { type: 'string' },
                    activities: { type: 'array' },
                    lastUpdated: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Invalid days parameter',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          500: {
            description: 'Failed to fetch history',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: HistoryParams }>, reply: FastifyReply) => {
      try {
        const { userId } = await authenticate(request);
        const { days } = request.params;

        const daysNumber = parseInt(days);
        if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
          return reply.code(400).send({
            error: 'Invalid days parameter',
            message: 'Days must be a number between 1 and 365'
          });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNumber);

        const schedules = await Schedule.find({
          userId,
          createdAt: { $gte: startDate }
        }).sort({ createdAt: -1 });

        return reply.send({
          days: daysNumber,
          count: schedules.length,
          schedules: schedules.map(s => ({
            courseId: s.courseId,
            date: s.date,
            activities: s.activities,
            lastUpdated: s.lastUpdated
          }))
        });

      } catch (error) {
        console.error('Error fetching schedule history:', error);
        return reply.code(500).send({
          error: 'Failed to fetch history',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Limpiar caché de horarios
  fastify.delete(
    '/schedule/cache',
    {
      schema: {
        tags: ['schedule'],
        description: 'Clear schedule cache older than one week',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Cache cleared successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              deletedCount: { type: 'number' }
            }
          },
          500: {
            description: 'Failed to clear cache',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = await authenticate(request);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const result = await Schedule.deleteMany({
          userId,
          createdAt: { $lt: oneWeekAgo }
        });

        return reply.send({
          message: 'Cache cleared successfully',
          deletedCount: result.deletedCount
        });

      } catch (error) {
        console.error('Error clearing cache:', error);
        return reply.code(500).send({
          error: 'Failed to clear cache',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}
