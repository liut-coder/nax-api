import type { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.route.js';
import { auditRoutes } from './modules/audit/audit.route.js';
import { fileRoutes } from './modules/files/file.route.js';
import { healthRoutes } from './modules/health/health.route.js';
import { permissionRoutes } from './modules/permissions/permission.route.js';
import { roleRoutes } from './modules/roles/role.route.js';
import { settingRoutes } from './modules/settings/setting.route.js';
import { userRoutes } from './modules/users/user.route.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(
    async (api) => {
      await api.register(healthRoutes, { prefix: '/health' });
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(userRoutes, { prefix: '/users' });
      await api.register(roleRoutes, { prefix: '/roles' });
      await api.register(permissionRoutes, { prefix: '/permissions' });
      await api.register(settingRoutes, { prefix: '/settings' });
      await api.register(auditRoutes, { prefix: '/audit-logs' });
      await api.register(fileRoutes, { prefix: '/files' });
    },
    { prefix: '/api/v1' },
  );
}

