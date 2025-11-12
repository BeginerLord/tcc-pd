import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/authService';
import { User, IUser } from '../models/User';
import { LoginCredentials } from '../types/auth';
import { encrypt, decrypt } from '../utils/crypto';

interface LoginRequestBody {
  username: string;
  password: string;
  simaUsername: string;
  simaPassword: string;
}

interface AuthTokenPayload {
  userId: string;
  username: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      description: 'Register a new user with credentials and SIMA credentials',
      body: {
        type: 'object',
        required: ['username', 'password', 'simaUsername', 'simaPassword'],
        properties: {
          username: { type: 'string', description: 'Username for the application' },
          password: { type: 'string', description: 'Password for the application' },
          simaUsername: { type: 'string', description: 'Username for SIMA system' },
          simaPassword: { type: 'string', description: 'Password for SIMA system' }
        }
      },
      response: {
        200: {
          description: 'Successful registration',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string', description: 'JWT authentication token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: 'Missing required fields',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        401: {
          description: 'SIMA authentication failed',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        409: {
          description: 'User already exists',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) => {
    try {
      const { username, password, simaUsername, simaPassword } = request.body;

      console.log('📝 Registration attempt:', { username, simaUsername, hasPassword: !!password, hasSimaPassword: !!simaPassword });

      if (!username || !password || !simaUsername || !simaPassword) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields'
        });
      }

      const existingUser = await User.findOne({ username });
      console.log('🔍 Existing user check:', { username, found: !!existingUser });

      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: 'User already exists'
        });
      }

      console.log('🔐 About to call authService.login with:', { simaUsername, passwordLength: simaPassword?.length });

      const simaLoginResult = await authService.login({
        username: simaUsername,
        password: simaPassword
      });

      console.log('📊 SIMA login result:', {
        success: simaLoginResult.success,
        error: simaLoginResult.error,
        hasCookies: !!simaLoginResult.cookies,
        cookiesCount: simaLoginResult.cookies?.length || 0
      });

      if (!simaLoginResult.success) {
        console.log('❌ SIMA authentication failed:', simaLoginResult.error);
        return reply.status(401).send({
          success: false,
          error: `SIMA authentication failed: ${simaLoginResult.error}`
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const encryptedSimaPassword = encrypt(simaPassword);

      const user = new User({
        username,
        passwordHash,
        simaCredentials: {
          username: simaUsername,
          encryptedPassword: encryptedSimaPassword
        },
        sessions: [{
          cookies: simaLoginResult.cookies || [],
          loginToken: simaLoginResult.sessionData?.loginToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isActive: true
        }]
      });

      await user.save();

      const token = jwt.sign(
        { userId: user._id, username: user.username } as AuthTokenPayload,
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      reply.send({
        success: true,
        token,
        user: {
          id: (user._id as any),
          username: user.username
        }
      });
    } catch (error) {
      console.error('❌ Registration route error:', error);
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  });

  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      description: 'Login with username and password',
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', description: 'Username' },
          password: { type: 'string', description: 'Password' }
        }
      },
      response: {
        200: {
          description: 'Successful login',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string', description: 'JWT authentication token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: 'Missing credentials',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        401: {
          description: 'Invalid credentials or session expired',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { username: string; password: string } }>, reply: FastifyReply) => {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Username and password required'
        });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const activeSession = user.sessions.find(s =>
        s.isActive && s.expiresAt > new Date()
      );

      if (!activeSession || !(await authService.validateSession(activeSession.cookies))) {
        console.log('🔄 Session invalid or expired, attempting re-login to SIMA...');

        let decryptedPassword: string;
        try {
          decryptedPassword = decrypt(user.simaCredentials.encryptedPassword);
        } catch (decryptError) {
          return reply.status(401).send({
            success: false,
            error: 'Session expired and stored credentials are invalid. Please register again.'
          });
        }

        const simaLoginResult = await authService.login({
          username: user.simaCredentials.username,
          password: decryptedPassword
        });

        console.log('📊 SIMA re-login result:', {
          success: simaLoginResult.success,
          error: simaLoginResult.error,
          hasCookies: !!simaLoginResult.cookies,
          cookiesCount: simaLoginResult.cookies?.length || 0
        });

        if (!simaLoginResult.success) {
          return reply.status(401).send({
            success: false,
            error: `SIMA session expired and re-authentication failed: ${simaLoginResult.error}`
          });
        }

        user.sessions.forEach(s => s.isActive = false);
        user.sessions.push({
          cookies: simaLoginResult.cookies || [],
          loginToken: simaLoginResult.sessionData?.loginToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isActive: true
        });

        await user.save();
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username } as AuthTokenPayload,
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      reply.send({
        success: true,
        token,
        user: {
          id: (user._id as any),
          username: user.username
        }
      });
    } catch (error) {
      console.error('❌ Login route error:', error);
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  });

  fastify.get('/validate', {
    schema: {
      tags: ['auth'],
      description: 'Validate JWT token and check session status',
      security: [{ bearerAuth: [] }],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'Bearer token' }
        },
        required: ['authorization']
      },
      response: {
        200: {
          description: 'Token is valid',
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                cookies: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            sessionValid: { type: 'boolean' }
          }
        },
        401: {
          description: 'Invalid or missing token',
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return reply.status(401).send({
          success: false,
          error: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AuthTokenPayload;
      const user = await User.findById(decoded.userId) as IUser | null;

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid token'
        });
      }

      const activeSession = user.sessions.find(s =>
        s.isActive && s.expiresAt > new Date()
      );

      const isSessionValid = activeSession ?
        await authService.validateSession(activeSession.cookies) : false;

      reply.send({
        valid: true,
        success: true,
        user: {
          id: (user._id as any),
          username: user.username,
          cookies: activeSession?.cookies || []
        },
        sessionValid: isSessionValid
      });
    } catch (error) {
      reply.status(401).send({
        valid: false,
        success: false,
        error: 'Invalid token'
      });
    }
  });
}