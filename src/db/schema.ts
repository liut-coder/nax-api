import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 80 }).notNull(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    status: varchar('status', { length: 40 }).notNull().default('active'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  }),
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 80 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description').notNull().default(''),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex('roles_key_idx').on(table.key),
  }),
);

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 120 }).notNull(),
    resource: varchar('resource', { length: 80 }).notNull(),
    action: varchar('action', { length: 80 }).notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex('permissions_key_idx').on(table.key),
  }),
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: uniqueIndex('user_roles_user_role_idx').on(table.userId, table.roleId),
    userIdx: index('user_roles_user_idx').on(table.userId),
  }),
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: uniqueIndex('role_permissions_role_permission_idx').on(table.roleId, table.permissionId),
    roleIdx: index('role_permissions_role_idx').on(table.roleId),
  }),
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 80 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('refresh_tokens_token_hash_idx').on(table.tokenHash),
    userIdx: index('refresh_tokens_user_idx').on(table.userId),
  }),
);

export const systemSettings = pgTable(
  'system_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 120 }).notNull(),
    value: jsonb('value').notNull(),
    group: varchar('group', { length: 80 }).notNull().default('general'),
    type: varchar('type', { length: 40 }).notNull().default('json'),
    isPublic: boolean('is_public').notNull().default(false),
    isEditable: boolean('is_editable').notNull().default(true),
    description: text('description').notNull().default(''),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex('system_settings_key_idx').on(table.key),
  }),
);

export const menus = pgTable(
  'menus',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parentId: uuid('parent_id'),
    key: varchar('key', { length: 120 }).notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    path: varchar('path', { length: 240 }),
    icon: varchar('icon', { length: 80 }),
    permissionKey: varchar('permission_key', { length: 120 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    isEnabled: boolean('is_enabled').notNull().default(true),
    meta: jsonb('meta').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex('menus_key_idx').on(table.key),
    parentIdx: index('menus_parent_idx').on(table.parentId),
  }),
);

export const dataDictionaries = pgTable(
  'data_dictionaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 120 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description').notNull().default(''),
    isSystem: boolean('is_system').notNull().default(false),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex('data_dictionaries_key_idx').on(table.key),
  }),
);

export const dataDictionaryItems = pgTable(
  'data_dictionary_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dictionaryId: uuid('dictionary_id')
      .notNull()
      .references(() => dataDictionaries.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 160 }).notNull(),
    value: varchar('value', { length: 160 }).notNull(),
    color: varchar('color', { length: 40 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    meta: jsonb('meta').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dictionaryValueIdx: uniqueIndex('data_dictionary_items_dictionary_value_idx').on(table.dictionaryId, table.value),
    dictionaryIdx: index('data_dictionary_items_dictionary_idx').on(table.dictionaryId),
  }),
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 120 }).notNull(),
    resource: varchar('resource', { length: 120 }).notNull(),
    resourceId: varchar('resource_id', { length: 120 }),
    ipAddress: varchar('ip_address', { length: 80 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorIdx: index('audit_logs_actor_idx').on(table.actorUserId),
    resourceIdx: index('audit_logs_resource_idx').on(table.resource, table.resourceId),
  }),
);

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originalName: text('original_name').notNull(),
    storedName: text('stored_name').notNull(),
    mimeType: varchar('mime_type', { length: 160 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    path: text('path').notNull(),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uploadedByIdx: index('files_uploaded_by_idx').on(table.uploadedBy),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const dataDictionariesRelations = relations(dataDictionaries, ({ many }) => ({
  items: many(dataDictionaryItems),
}));

export const dataDictionaryItemsRelations = relations(dataDictionaryItems, ({ one }) => ({
  dictionary: one(dataDictionaries, {
    fields: [dataDictionaryItems.dictionaryId],
    references: [dataDictionaries.id],
  }),
}));

export const menusRelations = relations(menus, ({ one }) => ({
  parent: one(menus, {
    fields: [menus.parentId],
    references: [menus.id],
  }),
}));
