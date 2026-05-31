import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError, UnauthorizedError } from '../../shared/errors.js';

vi.mock('../../config/env.js', () => ({
  env: {
    REFRESH_COOKIE_NAME: 'refresh',
    REFRESH_TOKEN_DAYS: 30,
    COOKIE_SECURE: false,
    JWT_ACCESS_EXPIRES_IN: '15m',
    LOGIN_FAILURE_LIMIT: 2,
    LOGIN_FAILURE_WINDOW_SECONDS: 900,
  },
}));

vi.mock('../../shared/audit.js', () => ({
  writeAudit: vi.fn(),
}));

vi.mock('../../shared/password.js', () => ({
  hashPassword: vi.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: vi.fn(),
}));

vi.mock('../../shared/token.js', () => ({
  addDays: vi.fn(() => new Date('2026-06-30T00:00:00Z')),
  createOpaqueToken: vi.fn(() => 'refresh-token'),
  hashToken: vi.fn((token: string) => `hash:${token}`),
}));

vi.mock('./auth.repository.js', () => ({
  createRefreshToken: vi.fn(),
  findActiveRefreshToken: vi.fn(),
  findUserById: vi.fn(),
  findUserForLogin: vi.fn(),
  getUserPermissionKeys: vi.fn(),
  getUserRefreshToken: vi.fn(),
  listEnabledMenus: vi.fn(),
  listUserRefreshTokens: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeRefreshTokenById: vi.fn(),
  revokeUserRefreshTokens: vi.fn(),
  touchLastLogin: vi.fn(),
  touchRefreshToken: vi.fn(),
  updateCurrentUserPassword: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
}));

const password = await import('../../shared/password.js');
const repository = await import('./auth.repository.js');
const service = await import('./auth.service.js');

function makeRequest(ip = '127.0.0.1') {
  return {
    ip,
    headers: { 'user-agent': 'vitest' },
  } as never;
}

function makeReply() {
  return {
    jwtSign: vi.fn(async () => 'access-token'),
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  } as never;
}

const user = {
  id: 'user-1',
  email: 'admin@example.com',
  username: 'admin',
  displayName: 'Admin',
  passwordHash: 'hash',
  status: 'active',
  isActive: true,
};

describe('auth service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(repository.findUserForLogin).mockResolvedValue(user as never);
    vi.mocked(repository.getUserPermissionKeys).mockResolvedValue(['user:list']);
    vi.mocked(password.verifyPassword).mockResolvedValue(true);
  });

  it('logs in and issues access and refresh tokens', async () => {
    const reply = makeReply();
    const result = await service.login(makeRequest(), reply, { account: 'admin@example.com', password: 'ChangeMe123!' });

    expect(result.accessToken).toBe('access-token');
    expect(result.user.permissions).toEqual(['user:list']);
    expect(repository.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ tokenHash: 'hash:refresh-token' }));
  });

  it('rejects invalid credentials', async () => {
    vi.mocked(password.verifyPassword).mockResolvedValue(false);

    await expect(service.login(makeRequest('10.0.0.1'), makeReply(), { account: 'admin@example.com', password: 'bad' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('locks repeated failed login attempts in the configured window', async () => {
    vi.mocked(password.verifyPassword).mockResolvedValue(false);
    const request = makeRequest('10.0.0.2');
    const input = { account: 'admin@example.com', password: 'bad' };

    await expect(service.login(request, makeReply(), input)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(service.login(request, makeReply(), input)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(service.login(request, makeReply(), input)).rejects.toMatchObject({ code: 'LOGIN_LOCKED', statusCode: 429 });
  });
});
