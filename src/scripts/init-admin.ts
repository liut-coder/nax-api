import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db, closeDb } from '../db/client.js';
import { roles, userRoles, users } from '../db/schema.js';
import { hashPassword } from '../shared/password.js';

async function main(): Promise<void> {
  const password = env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }

  const adminRole = await db.query.roles.findFirst({ where: eq(roles.key, 'admin') });
  if (!adminRole) {
    throw new Error('admin role not found. Run npm run seed first.');
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, env.ADMIN_EMAIL) });
  const passwordHash = await hashPassword(password);

  const admin =
    existing ??
    (
      await db
        .insert(users)
        .values({
          email: env.ADMIN_EMAIL,
          username: env.ADMIN_USERNAME,
          displayName: env.ADMIN_DISPLAY_NAME,
          passwordHash,
        })
        .returning()
    )[0];

  if (existing) {
    await db
      .update(users)
      .set({
        username: env.ADMIN_USERNAME,
        displayName: env.ADMIN_DISPLAY_NAME,
        passwordHash,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
  }

  await db
    .insert(userRoles)
    .values({ userId: admin.id, roleId: adminRole.id })
    .onConflictDoNothing();

  console.log(`admin ready: ${env.ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDb();
  });

