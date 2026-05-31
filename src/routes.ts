import type { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.route.js';
import { auditRoutes } from './modules/audit/audit.route.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.route.js';
import { dictionaryRoutes } from './modules/dictionaries/dictionary.route.js';
import { fileRoutes } from './modules/files/file.route.js';
import { generatorRoutes } from './modules/generator/generator.route.js';
import { healthRoutes } from './modules/health/health.route.js';
import { menuRoutes } from './modules/menus/menu.route.js';
import { permissionRoutes } from './modules/permissions/permission.route.js';
import { roleRoutes } from './modules/roles/role.route.js';
import { sessionRoutes } from './modules/sessions/session.route.js';
import { settingRoutes } from './modules/settings/setting.route.js';
import { systemRoutes } from './modules/system/system.route.js';
import { userRoutes } from './modules/users/user.route.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(
    async (api) => {
      await api.register(healthRoutes, { prefix: '/health' });
      await api.register(systemRoutes, { prefix: '/system' });
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(dashboardRoutes, { prefix: '/dashboard' });
      await api.register(userRoutes, { prefix: '/users' });
      await api.register(roleRoutes, { prefix: '/roles' });
      await api.register(permissionRoutes, { prefix: '/permissions' });
      await api.register(menuRoutes, { prefix: '/menus' });
      await api.register(settingRoutes, { prefix: '/settings' });
      await api.register(dictionaryRoutes, { prefix: '/dictionaries' });
      await api.register(auditRoutes, { prefix: '/audit-logs' });
      await api.register(fileRoutes, { prefix: '/files' });
      await api.register(sessionRoutes, { prefix: '/sessions' });
      await api.register(generatorRoutes, { prefix: '/generator' });
    },
    { prefix: '/api/v1' },
  );
}
