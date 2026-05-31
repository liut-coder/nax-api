import { pingDatabase } from './health.repository.js';

export function getLiveness() {
  return {
    status: 'ok' as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

export async function getReadiness() {
  await pingDatabase();
  return {
    ...getLiveness(),
    checks: {
      database: 'ok' as const,
    },
  };
}

export const getHealth = getReadiness;
