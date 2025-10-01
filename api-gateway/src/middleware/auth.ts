import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceProxy } from '../utils/serviceProxy';

const serviceProxy = new ServiceProxy();

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Validar token con el servicio principal
    const validationResponse = await serviceProxy.proxyRequest(
      'main',
      '/api/auth/validate',
      'GET',
      undefined,
      { 'Authorization': `Bearer ${token}` }
    );

    if (!validationResponse.valid) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Adjuntar información del usuario a la request
    (request as any).user = validationResponse.user;

  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return reply.code(error.status || 401).send({
      error: 'Unauthorized',
      message: error.message || 'Authentication failed'
    });
  }
}
