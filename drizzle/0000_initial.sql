CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  username varchar(80) NOT NULL,
  display_name varchar(120) NOT NULL,
  password_hash text NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users (username);
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(80) NOT NULL,
  name varchar(120) NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS roles_key_idx ON roles (key);
CREATE INDEX IF NOT EXISTS roles_created_at_idx ON roles (created_at);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL,
  resource varchar(80) NOT NULL,
  action varchar(80) NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_key_idx ON permissions (key);
CREATE INDEX IF NOT EXISTS permissions_resource_idx ON permissions (resource);
CREATE INDEX IF NOT EXISTS permissions_created_at_idx ON permissions (created_at);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_idx ON user_roles (user_id, role_id);
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles (role_id);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_permission_idx ON role_permissions (role_id, permission_id);
CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_idx ON role_permissions (permission_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  user_agent text,
  ip_address varchar(80),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash_idx ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_created_at_idx ON refresh_tokens (created_at);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL,
  value jsonb NOT NULL,
  "group" varchar(80) NOT NULL DEFAULT 'general',
  type varchar(40) NOT NULL DEFAULT 'json',
  is_public boolean NOT NULL DEFAULT false,
  is_editable boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS system_settings_key_idx ON system_settings (key);
CREATE INDEX IF NOT EXISTS system_settings_group_idx ON system_settings ("group");
CREATE INDEX IF NOT EXISTS system_settings_public_group_idx ON system_settings (is_public, "group");
CREATE INDEX IF NOT EXISTS system_settings_created_at_idx ON system_settings (created_at);

CREATE TABLE IF NOT EXISTS menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid,
  key varchar(120) NOT NULL,
  title varchar(160) NOT NULL,
  path varchar(240),
  icon varchar(80),
  permission_key varchar(120),
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_enabled boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS menus_key_idx ON menus (key);
CREATE INDEX IF NOT EXISTS menus_parent_idx ON menus (parent_id);
CREATE INDEX IF NOT EXISTS menus_enabled_idx ON menus (is_enabled);
CREATE INDEX IF NOT EXISTS menus_created_at_idx ON menus (created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  resource varchar(120) NOT NULL,
  resource_id varchar(120),
  ip_address varchar(80),
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs (resource, resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS audit_logs_resource_action_created_at_idx ON audit_logs (resource, action, created_at);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name text NOT NULL,
  stored_name text NOT NULL,
  mime_type varchar(160) NOT NULL,
  size_bytes integer NOT NULL,
  path text NOT NULL,
  category varchar(80) NOT NULL DEFAULT 'attachment',
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS files_uploaded_by_idx ON files (uploaded_by);
CREATE INDEX IF NOT EXISTS files_category_idx ON files (category);
CREATE INDEX IF NOT EXISTS files_category_created_at_idx ON files (category, created_at);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON files (created_at);
