import { pingDatabase } from './health.repository.js';

export async function getHealth() {
  await pingDatabase();
  return {
    status: 'ok' as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

