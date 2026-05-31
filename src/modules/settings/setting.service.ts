import type { FastifyRequest } from 'fastify';
import { getPagination, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { SettingListQuery, UpsertSettingBody } from './setting.schema.js';
import { getSetting, listSettings, upsertSetting } from './setting.repository.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listSettingsService(query: SettingListQuery) {
  const pagination = getPagination(query);
  const result = await listSettings({ q: query.q, limit: pagination.limit, offset: pagination.offset });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function getSettingService(key: string) {
  const setting = await getSetting(key);
  if (!setting) throw new NotFoundError('Setting not found');
  return setting;
}

export async function upsertSettingService(request: FastifyRequest, key: string, input: UpsertSettingBody) {
  const setting = await upsertSetting({
    key,
    value: input.value,
    description: input.description,
    updatedBy: request.auth?.userId,
  });
  await writeAudit(request, { action: 'upsert', resource: 'setting', resourceId: key });
  return setting;
}

