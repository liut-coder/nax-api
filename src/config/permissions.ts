export const permissions = [
  'user:list',
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'role:list',
  'role:read',
  'role:create',
  'role:update',
  'role:delete',
  'permission:list',
  'setting:list',
  'setting:update',
  'audit:list',
  'file:upload',
  'file:list',
] as const;

export type PermissionKey = (typeof permissions)[number];

export const rolePermissions: Record<string, PermissionKey[]> = {
  admin: [...permissions],
  operator: [
    'user:list',
    'user:read',
    'role:list',
    'permission:list',
    'setting:list',
    'audit:list',
    'file:upload',
    'file:list',
  ],
  viewer: ['user:list', 'user:read', 'role:list', 'permission:list', 'setting:list', 'audit:list', 'file:list'],
};

export const defaultRoles = [
  { key: 'admin', name: 'Administrator', description: 'Full system access' },
  { key: 'operator', name: 'Operator', description: 'Operational access without destructive administration' },
  { key: 'viewer', name: 'Viewer', description: 'Read-only access' },
] as const;

