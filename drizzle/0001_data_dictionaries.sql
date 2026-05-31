CREATE TABLE IF NOT EXISTS data_dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL,
  name varchar(160) NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS data_dictionaries_key_idx ON data_dictionaries (key);
CREATE INDEX IF NOT EXISTS data_dictionaries_enabled_idx ON data_dictionaries (is_enabled);
CREATE INDEX IF NOT EXISTS data_dictionaries_created_at_idx ON data_dictionaries (created_at);

CREATE TABLE IF NOT EXISTS data_dictionary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dictionary_id uuid NOT NULL REFERENCES data_dictionaries(id) ON DELETE CASCADE,
  label varchar(160) NOT NULL,
  value varchar(160) NOT NULL,
  color varchar(40),
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS data_dictionary_items_dictionary_value_idx ON data_dictionary_items (dictionary_id, value);
CREATE INDEX IF NOT EXISTS data_dictionary_items_dictionary_idx ON data_dictionary_items (dictionary_id);
CREATE INDEX IF NOT EXISTS data_dictionary_items_dictionary_sort_idx ON data_dictionary_items (dictionary_id, sort_order);
