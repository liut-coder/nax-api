import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { AppError, UnauthorizedError } from '../../shared/errors.js';
import { hashPassword, verifyPassword } from '../../shared/password.js';
import { addDays, createOpaqueToken, hashToken } from '../../shared/token.js';
import { writeAudit } from '../../shared/audit.js';
import {
  createRefreshToken,
  consumeActiveRefreshToken,
  findUserById,
  findUserForLogin,
  getUserPermissionKeys,
  getUserRefreshToken,
  listEnabledMenus,
  listUserRefreshTokens,
  revokeRefreshToken,
  revokeRefreshTokenById,
  revokeUserRefreshTokens,
  touchLastLogin,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
} from './auth.repository.js';
import type { ChangePasswordBody, LoginBody, UpdateProfileBody } from './auth.schema.js';

type LoginFailureBucket = {
  count: number;
  firstFailedAt: number;
};

const loginFailures = new Map<string, LoginFailureBucket>();

function loginFailureKey(request: FastifyRequest, account: string): string {
  return `${request.ip}:${account.trim().toLowerCase()}`;
}

function ensureLoginAllowed(request: FastifyRequest, account: string): void {
  const key = loginFailureKey(request, account);
  const bucket = loginFailures.get(key);
  if (!bucket) return;
  const now = Date.now();
  const windowMs = env.LOGIN_FAILURE_WINDOW_SECONDS * 1000;
  if (now - bucket.firstFailedAt > windowMs) {
    loginFailures.delete(key);
    return;
  }
  if (bucket.count >= env.LOGIN_FAILURE_LIMIT) {
    throw new AppError('LOGIN_LOCKED', 'Too many failed login attempts. Try again later.', 429);
  }
}

function recordLoginFailure(request: FastifyRequest, account: string): void {
  const key = loginFailureKey(request, account);
  const now = Date.now();
  const windowMs = env.LOGIN_FAILURE_WINDOW_SECONDS * 1000;
  const bucket = loginFailures.get(key);
  if (!bucket || now - bucket.firstFailedAt > windowMs) {
    loginFailures.set(key, { count: 1, firstFailedAt: now });
    return;
  }
  bucket.count += 1;
}

function clearLoginFailures(request: FastifyRequest, account: string): void {
  loginFailures.delete(loginFailureKey(request, account));
}

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
      status: user.status,
      permissions,
    },
  };
}

function isUsableUser(user: Pick<NonNullable<Awaited<ReturnType<typeof findUserById>>>, 'isActive' | 'status'>): boolean {
  return user.isActive && user.status === 'active';
}

export async function login(request: FastifyRequest, reply: FastifyReply, input: LoginBody) {
  ensureLoginAllowed(request, input.account);
  const user = await findUserForLogin(input.account);
  if (!user || !isUsableUser(user) || !(await verifyPassword(user.passwordHash, input.password))) {
    recordLoginFailure(request, input.account);
    throw new UnauthorizedError('Invalid account or password');
  }
  clearLoginFailures(request, input.account);
  await touchLastLogin(user.id);
  await writeAudit(request, { action: 'login', resource: 'auth', resourceId: user.id });
  return issueSession(request, reply, user);
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[env.REFRESH_COOKIE_NAME];
  if (!token) throw new UnauthorizedError('Refresh token missing');
  const tokenHash = hashToken(token);
  const stored = await consumeActiveRefreshToken(tokenHash);
  if (!stored) throw new UnauthorizedError('Refresh token invalid');
  const user = await findUserById(stored.userId);
  if (!user || !isUsableUser(user)) throw new UnauthorizedError('User disabled');
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
  if (!user || !isUsableUser(user)) throw new UnauthorizedError();
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
    permissions: request.auth.permissions,
  };
}

export async function updateProfile(request: FastifyRequest, input: UpdateProfileBody) {
  if (!request.auth?.userId) throw new UnauthorizedError();
  const user = await updateCurrentUserProfile(request.auth.userId, input);
  if (!user || !isUsableUser(user)) throw new UnauthorizedError();
  await writeAudit(request, { action: 'update_profile', resource: 'auth', resourceId: user.id });
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
    permissions: request.auth.permissions,
  };
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply, input: ChangePasswordBody) {
  if (!request.auth?.userId) throw new UnauthorizedError();
  const user = await findUserById(request.auth.userId);
  if (!user || !isUsableUser(user)) throw new UnauthorizedError();
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new UnauthorizedError('Current password invalid');
  }
  await updateCurrentUserPassword(user.id, await hashPassword(input.newPassword));
  await revokeUserRefreshTokens(user.id);
  clearRefreshCookie(reply);
  await writeAudit(request, { action: 'change_password', resource: 'auth', resourceId: user.id });
  return { changed: true };
}

export async function listSessions(request: FastifyRequest) {
  if (!request.auth?.userId) throw new UnauthorizedError();
  const sessions = await listUserRefreshTokens(request.auth.userId);
  return sessions.map((session) => ({
    id: session.id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    lastUsedAt: session.lastUsedAt,
    createdAt: session.createdAt,
    isActive: !session.revokedAt && session.expiresAt > new Date(),
  }));
}

export async function revokeSession(request: FastifyRequest, tokenId: string) {
  if (!request.auth?.userId) throw new UnauthorizedError();
  const session = await getUserRefreshToken(request.auth.userId, tokenId);
  if (!session) throw new UnauthorizedError('Session not found');
  await revokeRefreshTokenById(request.auth.userId, tokenId);
  await writeAudit(request, { action: 'revoke_session', resource: 'auth', resourceId: tokenId });
  return { revoked: true };
}

export async function currentUserMenus(request: FastifyRequest) {
  if (!request.auth?.userId) throw new UnauthorizedError();
  const permissions = new Set(request.auth.permissions);
  const rows = await listEnabledMenus();
  const allowed = rows.filter((menu) => menu.isVisible && (!menu.permissionKey || permissions.has(menu.permissionKey)));
  const byParent = new Map<string | null, typeof allowed>();
  for (const menu of allowed) {
    const parentId = menu.parentId ?? null;
    const current = byParent.get(parentId) ?? [];
    current.push(menu);
    byParent.set(parentId, current);
  }
  const build = (parentId: string | null): unknown[] =>
    (byParent.get(parentId) ?? []).map((menu) => ({
      id: menu.id,
      key: menu.key,
      title: menu.title,
      path: menu.path,
      icon: menu.icon,
      permissionKey: menu.permissionKey,
      sortOrder: menu.sortOrder,
      meta: menu.meta,
      children: build(menu.id),
    }));
  return build(null);
}
