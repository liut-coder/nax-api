import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('RBAC guard', () => {
  it('allows requests with the required permission', async () => {
    const app = await buildApp();
    app.get('/__rbac_allowed', { preHandler: [app.authorize('demo:read')] }, async () => ({ ok: true }));

    const token = await app.jwt.sign({ permissions: ['demo:read'], email: 'u@example.com', username: 'u' }, { sub: 'user-1' });
    const response = await app.inject({
      method: 'GET',
      url: '/__rbac_allowed',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it('rejects requests without the required permission', async () => {
    const app = await buildApp();
    app.get('/__rbac_denied', { preHandler: [app.authorize('demo:write')] }, async () => ({ ok: true }));

    const token = await app.jwt.sign({ permissions: ['demo:read'], email: 'u@example.com', username: 'u' }, { sub: 'user-1' });
    const response = await app.inject({
      method: 'GET',
      url: '/__rbac_denied',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
    await app.close();
  });
});
