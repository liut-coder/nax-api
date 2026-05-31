ALTER TABLE files ADD COLUMN IF NOT EXISTS category varchar(80) NOT NULL DEFAULT 'attachment';
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS files_category_idx ON files (category);
