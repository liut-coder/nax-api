CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at);

CREATE INDEX IF NOT EXISTS roles_created_at_idx ON roles (created_at);

CREATE INDEX IF NOT EXISTS permissions_resource_idx ON permissions (resource);
CREATE INDEX IF NOT EXISTS permissions_created_at_idx ON permissions (created_at);

CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_idx ON role_permissions (permission_id);

CREATE INDEX IF NOT EXISTS refresh_tokens_created_at_idx ON refresh_tokens (created_at);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);

CREATE INDEX IF NOT EXISTS system_settings_group_idx ON system_settings ("group");
CREATE INDEX IF NOT EXISTS system_settings_public_group_idx ON system_settings (is_public, "group");
CREATE INDEX IF NOT EXISTS system_settings_created_at_idx ON system_settings (created_at);

CREATE INDEX IF NOT EXISTS menus_enabled_idx ON menus (is_enabled);
CREATE INDEX IF NOT EXISTS menus_created_at_idx ON menus (created_at);

CREATE INDEX IF NOT EXISTS data_dictionaries_enabled_idx ON data_dictionaries (is_enabled);
CREATE INDEX IF NOT EXISTS data_dictionaries_created_at_idx ON data_dictionaries (created_at);
CREATE INDEX IF NOT EXISTS data_dictionary_items_dictionary_sort_idx ON data_dictionary_items (dictionary_id, sort_order);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS audit_logs_resource_action_created_at_idx ON audit_logs (resource, action, created_at);

CREATE INDEX IF NOT EXISTS files_category_created_at_idx ON files (category, created_at);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON files (created_at);
