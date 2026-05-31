import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors.js';
import { verifyPassword } from '../../shared/password.js';
import { addDays, createOpaqueToken, hashToken } from '../../shared/token.js';
import { writeAudit } from '../../shared/audit.js';
import {
  createRefreshToken,
  findActiveRefreshToken,
  findUserById,
  findUserForLogin,
  getUserPermissionKeys,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  touchLastLogin,
} from './auth.repository.js';
import type { LoginBody } from './auth.schema.js';

function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(env.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60,
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(env.REFRESH_COOKIE_NAME, {
    path: '/api/v1/auth',
  });
}

async function issueSession(request: FastifyRequest, reply: FastifyReply, user: NonNullable<Awaited<ReturnType<typeof findUserById>>>) {
  const permissions = await getUserPermissionKeys(user.id);
  const accessToken = await reply.jwtSign(
    {
      email: user.email,
      username: user.username,
      permissions,
    },
    {
      sub: user.id,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  );
  const refreshToken = createOpaqueToken();
  await createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: addDays(new Date(), env.REFRESH_TOKEN_DAYS),
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip,
  });
  setRefreshCookie(reply, refreshToken);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      permissions,
    },
  };
}

export async function login(request: FastifyRequest, reply: FastifyReply, input: LoginBody) {
  const user = await findUserForLogin(input.account);
  if (!user || !user.isActive || !(await verifyPassword(user.passwordHash, input.password))) {
    throw new UnauthorizedError('Invalid account or password');
  }
  await touchLastLogin(user.id);
  await writeAudit(request, { action: 'login', resource: 'auth', resourceId: user.id });
  return issueSession(request, reply, user);
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[env.REFRESH_COOKIE_NAME];
  if (!token) throw new UnauthorizedError('Refresh token missing');
  const stored = await findActiveRefreshToken(hashToken(token));
  if (!stored) throw new UnauthorizedError('Refresh token invalid');
  await revokeRefreshToken(hashToken(token));
  const user = await findUserById(stored.userId);
  if (!user || !user.isActive) throw new UnauthorizedError('User disabled');
  await writeAudit(request, { action: 'refresh', resource: 'auth', resourceId: user.id });
  return issueSession(request, reply, user);
}

export async function logout(request: FastifyRequest, reply: FastifyReply): Promise<{ loggedOut: true }> {
  const token = request.cookies[env.REFRESH_COOKIE_NAME];
  if (token) await revokeRefreshToken(hashToken(token));
  clearRefreshCookie(reply);
  await writeAudit(request, { action: 'logout', resource: 'auth', resourceId: request.auth?.userId });
  return { loggedOut: true };
}

export async function logoutAll(request: FastifyRequest, reply: FastifyReply): Promise<{ loggedOut: true }> {
  if (!request.auth?.userId) throw new UnauthorizedError();
  await revokeUserRefreshTokens(request.auth.userId);
  clearRefreshCookie(reply);
  await writeAudit(request, { action: 'logout_all', resource: 'auth', resourceId: request.auth.userId });
  return { loggedOut: true };
}

export async function me(request: FastifyRequest) {
  if (!request.auth?.userId) throw new UnauthorizedError();
  const user = await findUserById(request.auth.userId);
  if (!user || !user.isActive) throw new UnauthorizedError();
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    permissions: request.auth.permissions,
  };
}

