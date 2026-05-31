import type { FastifyReply, FastifyRequest } from 'fastify';

export function ok<T>(reply: FastifyReply, request: FastifyRequest, data: T, message = 'ok'): FastifyReply {
  return reply.send({
    success: true,
    data,
    message,
    requestId: request.id,
  });
}

export function created<T>(reply: FastifyReply, request: FastifyRequest, data: T, message = 'created'): FastifyReply {
  return reply.code(201).send({
    success: true,
    data,
    message,
    requestId: request.id,
  });
}

export function fail(
  reply: FastifyReply,
  request: FastifyRequest,
  statusCode: number,
  code: string,
  message: string,
): FastifyReply {
  return reply.code(statusCode).send({
    success: false,
    error: {
      code,
      message,
    },
    requestId: request.id,
  });
}

