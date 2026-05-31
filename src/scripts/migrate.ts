import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pool, closeDb } from '../db/client.js';

async function ensureMigrationTable(): Promise<void> {
  await pool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function alreadyApplied(id: string): Promise<boolean> {
  const result = await pool.query('select 1 from schema_migrations where id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

async function markApplied(id: string): Promise<void> {
  await pool.query('insert into schema_migrations (id) values ($1)', [id]);
}

async function main(): Promise<void> {
  await ensureMigrationTable();
  const files = (await readdir('drizzle')).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    if (await alreadyApplied(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = await readFile(join('drizzle', file), 'utf8');
    await pool.query('begin');
    try {
      await pool.query(sql);
      await markApplied(file);
      await pool.query('commit');
      console.log(`applied ${file}`);
    } catch (error) {
      await pool.query('rollback');
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDb();
  });
