ALTER TABLE users ADD COLUMN IF NOT EXISTS status varchar(40) NOT NULL DEFAULT 'active';
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS "group" varchar(80) NOT NULL DEFAULT 'general';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS type varchar(40) NOT NULL DEFAULT 'json';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_editable boolean NOT NULL DEFAULT true;

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
