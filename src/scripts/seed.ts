import { eq } from 'drizzle-orm';
import { defaultRoles, permissions as permissionKeys, rolePermissions as defaultRolePermissions } from '../config/permissions.js';
import { db, closeDb } from '../db/client.js';
import {
  dataDictionaries,
  dataDictionaryItems,
  menus,
  permissions,
  rolePermissions,
  roles,
  systemSettings,
} from '../db/schema.js';

async function seedPermissions(): Promise<void> {
  for (const key of permissionKeys) {
    const [resource, action] = key.split(':');
    await db
      .insert(permissions)
      .values({
        key,
        resource,
        action,
        description: `${resource} ${action}`,
      })
      .onConflictDoUpdate({
        target: permissions.key,
        set: {
          resource,
          action,
          description: `${resource} ${action}`,
        },
      });
  }
}

async function seedRoles(): Promise<void> {
  for (const role of defaultRoles) {
    await db
      .insert(roles)
      .values({ ...role, isSystem: true })
      .onConflictDoUpdate({
        target: roles.key,
        set: {
          name: role.name,
          description: role.description,
          isSystem: true,
          updatedAt: new Date(),
        },
      });
  }
}

async function seedRolePermissions(): Promise<void> {
  const roleRows = await db.select().from(roles);
  const permissionRows = await db.select().from(permissions);
  const roleByKey = new Map(roleRows.map((role) => [role.key, role]));
  const permissionByKey = new Map(permissionRows.map((permission) => [permission.key, permission]));

  for (const [roleKey, permissionKeysForRole] of Object.entries(defaultRolePermissions)) {
    const role = roleByKey.get(roleKey);
    if (!role) continue;
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    const values = permissionKeysForRole
      .map((permissionKey) => permissionByKey.get(permissionKey))
      .filter((permission): permission is NonNullable<typeof permission> => Boolean(permission))
      .map((permission) => ({ roleId: role.id, permissionId: permission.id }));
    if (values.length > 0) await db.insert(rolePermissions).values(values);
  }
}

async function seedSettings(): Promise<void> {
  const settings = [
    {
      key: 'base.name',
      value: 'NAX Admin',
      group: 'base',
      type: 'string',
      isPublic: true,
      isEditable: true,
      description: 'System display name',
    },
    {
      key: 'base.logoUrl',
      value: '',
      group: 'base',
      type: 'url',
      isPublic: true,
      isEditable: true,
      description: 'System logo URL',
    },
    {
      key: 'base.version',
      value: '0.1.0',
      group: 'base',
      type: 'string',
      isPublic: true,
      isEditable: true,
      description: 'System version label',
    },
    {
      key: 'base.loginTitle',
      value: 'NAX Admin',
      group: 'base',
      type: 'string',
      isPublic: true,
      isEditable: true,
      description: 'Login page title',
    },
    {
      key: 'base.loginSubtitle',
      value: 'Reusable management backend scaffold',
      group: 'base',
      type: 'string',
      isPublic: true,
      isEditable: true,
      description: 'Login page subtitle',
    },
    {
      key: 'base.defaultLanguage',
      value: 'zh-CN',
      group: 'base',
      type: 'string',
      isPublic: true,
      isEditable: true,
      description: 'Default UI language',
    },
    {
      key: 'base.theme',
      value: { primaryColor: '#2563eb', mode: 'light' },
      group: 'base',
      type: 'json',
      isPublic: true,
      isEditable: true,
      description: 'Default UI theme',
    },
    {
      key: 'system.name',
      value: 'NAX Admin',
      group: 'general',
      type: 'string',
      isPublic: false,
      isEditable: true,
      description: 'Internal system name',
    },
  ] as const;

  for (const setting of settings) {
    await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          group: setting.group,
          type: setting.type,
          isPublic: setting.isPublic,
          isEditable: setting.isEditable,
          description: setting.description,
          updatedAt: new Date(),
        },
      });
  }
}

async function seedMenu(input: {
  parentKey?: string;
  key: string;
  title: string;
  path?: string;
  icon?: string;
  permissionKey?: string;
  sortOrder: number;
}): Promise<void> {
  const parent = input.parentKey ? await db.query.menus.findFirst({ where: eq(menus.key, input.parentKey) }) : undefined;
  await db
    .insert(menus)
    .values({
      parentId: parent?.id,
      key: input.key,
      title: input.title,
      path: input.path,
      icon: input.icon,
      permissionKey: input.permissionKey,
      sortOrder: input.sortOrder,
      isVisible: true,
      isEnabled: true,
    })
    .onConflictDoUpdate({
      target: menus.key,
      set: {
        parentId: parent?.id,
        title: input.title,
        path: input.path,
        icon: input.icon,
        permissionKey: input.permissionKey,
        sortOrder: input.sortOrder,
        isVisible: true,
        isEnabled: true,
        updatedAt: new Date(),
      },
    });
}

async function seedMenus(): Promise<void> {
  await seedMenu({ key: 'dashboard', title: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permissionKey: 'dashboard:read', sortOrder: 10 });
  await seedMenu({ key: 'system', title: 'System', path: '/system', icon: 'Settings', permissionKey: 'setting:list', sortOrder: 20 });
  await seedMenu({ parentKey: 'system', key: 'users', title: 'Users', path: '/system/users', icon: 'Users', permissionKey: 'user:list', sortOrder: 10 });
  await seedMenu({ parentKey: 'system', key: 'roles', title: 'Roles', path: '/system/roles', icon: 'Shield', permissionKey: 'role:list', sortOrder: 20 });
  await seedMenu({
    parentKey: 'system',
    key: 'permissions',
    title: 'Permissions',
    path: '/system/permissions',
    icon: 'KeyRound',
    permissionKey: 'permission:list',
    sortOrder: 30,
  });
  await seedMenu({ parentKey: 'system', key: 'menus', title: 'Menus', path: '/system/menus', icon: 'Menu', permissionKey: 'menu:list', sortOrder: 40 });
  await seedMenu({ parentKey: 'system', key: 'settings', title: 'Settings', path: '/system/settings', icon: 'SlidersHorizontal', permissionKey: 'setting:list', sortOrder: 50 });
  await seedMenu({
    parentKey: 'system',
    key: 'dictionaries',
    title: 'Dictionaries',
    path: '/system/dictionaries',
    icon: 'ListTree',
    permissionKey: 'dictionary:list',
    sortOrder: 60,
  });
  await seedMenu({ key: 'operations', title: 'Operations', path: '/operations', icon: 'Activity', permissionKey: 'audit:list', sortOrder: 30 });
  await seedMenu({
    parentKey: 'operations',
    key: 'audit-logs',
    title: 'Audit Logs',
    path: '/operations/audit-logs',
    icon: 'ClipboardList',
    permissionKey: 'audit:list',
    sortOrder: 10,
  });
  await seedMenu({ parentKey: 'operations', key: 'files', title: 'Files', path: '/operations/files', icon: 'Files', permissionKey: 'file:list', sortOrder: 20 });
  await seedMenu({
    parentKey: 'operations',
    key: 'sessions',
    title: 'Sessions',
    path: '/operations/sessions',
    icon: 'MonitorCheck',
    permissionKey: 'session:list',
    sortOrder: 30,
  });
  await seedMenu({
    parentKey: 'operations',
    key: 'generator',
    title: 'Generator',
    path: '/operations/generator',
    icon: 'Code2',
    permissionKey: 'generator:preview',
    sortOrder: 40,
  });
}

async function seedDictionary(input: {
  key: string;
  name: string;
  description: string;
  items: Array<{ label: string; value: string; color?: string; sortOrder: number }>;
}): Promise<void> {
  const [dictionary] = await db
    .insert(dataDictionaries)
    .values({
      key: input.key,
      name: input.name,
      description: input.description,
      isSystem: true,
    })
    .onConflictDoUpdate({
      target: dataDictionaries.key,
      set: {
        name: input.name,
        description: input.description,
        isSystem: true,
        isEnabled: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  for (const item of input.items) {
    await db
      .insert(dataDictionaryItems)
      .values({
        dictionaryId: dictionary.id,
        label: item.label,
        value: item.value,
        color: item.color,
        sortOrder: item.sortOrder,
      })
      .onConflictDoUpdate({
        target: [dataDictionaryItems.dictionaryId, dataDictionaryItems.value],
        set: {
          label: item.label,
          color: item.color,
          sortOrder: item.sortOrder,
          isEnabled: true,
          updatedAt: new Date(),
        },
      });
  }
}

async function seedDictionaries(): Promise<void> {
  await seedDictionary({
    key: 'common.status',
    name: 'Common Status',
    description: 'Generic enabled/disabled status values',
    items: [
      { label: 'Enabled', value: 'enabled', color: 'green', sortOrder: 10 },
      { label: 'Disabled', value: 'disabled', color: 'gray', sortOrder: 20 },
    ],
  });
  await seedDictionary({
    key: 'user.status',
    name: 'User Status',
    description: 'Generic user account status values',
    items: [
      { label: 'Active', value: 'active', color: 'green', sortOrder: 10 },
      { label: 'Disabled', value: 'disabled', color: 'gray', sortOrder: 20 },
      { label: 'Locked', value: 'locked', color: 'red', sortOrder: 30 },
    ],
  });
  await seedDictionary({
    key: 'release.channel',
    name: 'Release Channel',
    description: 'Reusable release channel values',
    items: [
      { label: 'Development', value: 'dev', color: 'blue', sortOrder: 10 },
      { label: 'Beta', value: 'beta', color: 'orange', sortOrder: 20 },
      { label: 'Stable', value: 'stable', color: 'green', sortOrder: 30 },
    ],
  });
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedSettings();
  await seedMenus();
  await seedDictionaries();
  console.log('seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDb();
  });
