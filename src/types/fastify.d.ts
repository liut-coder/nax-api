import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: {
      userId: string;
      email: string;
      username: string;
      permissions: string[];
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

