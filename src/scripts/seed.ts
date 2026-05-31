import { eq } from 'drizzle-orm';
import { defaultRoles, permissions as permissionKeys, rolePermissions as defaultRolePermissions } from '../config/permissions.js';
import { db, closeDb } from '../db/client.js';
import { permissions, rolePermissions, roles, systemSettings } from '../db/schema.js';

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
  await db
    .insert(systemSettings)
    .values({
      key: 'system.name',
      value: 'NAX Admin',
      description: 'Display name for this management backend',
    })
    .onConflictDoNothing();
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedSettings();
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

