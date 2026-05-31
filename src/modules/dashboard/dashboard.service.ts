import { getDashboardCounts, getRecentAuditLogs, getRecentLoginCount } from './dashboard.repository.js';

export async function getDashboardOverviewService() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [counts, recentAuditLogs, recentLogins24h] = await Promise.all([
    getDashboardCounts(),
    getRecentAuditLogs(10),
    getRecentLoginCount(since),
  ]);

  return {
    status: 'ok',
    generatedAt: new Date().toISOString(),
    counts,
    recentLogins24h,
    recentAuditLogs,
  };
}
