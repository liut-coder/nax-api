import type { FastifyRequest } from 'fastify';
import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { SettingListQuery, UpsertSettingBody } from './setting.schema.js';
import { getSetting, listSettings, upsertSetting } from './setting.repository.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';

export async function listSettingsService(query: SettingListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['key', 'group', 'createdAt'], 'key');
  const result = await listSettings({
    q: query.q,
    group: query.group,
    publicOnly: query.publicOnly,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function getSettingService(key: string) {
  const setting = await getSetting(key);
  if (!setting) throw new NotFoundError('Setting not found');
  return setting;
}

export async function upsertSettingService(request: FastifyRequest, key: string, input: UpsertSettingBody) {
  const existing = await getSetting(key);
  if (existing && !existing.isEditable) throw new ForbiddenError('Setting is not editable');
  const setting = await upsertSetting({
    key,
    value: input.value,
    group: input.group,
    type: input.type,
    isPublic: input.isPublic,
    isEditable: input.isEditable,
    description: input.description,
    updatedBy: request.auth?.userId,
  });
  await writeAudit(request, { action: 'upsert', resource: 'setting', resourceId: key });
  return setting;
}
