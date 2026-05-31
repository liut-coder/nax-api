import type { FastifyRequest } from 'fastify';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type {
  CreateDictionaryBody,
  CreateDictionaryItemBody,
  DictionaryListQuery,
  UpdateDictionaryBody,
  UpdateDictionaryItemBody,
} from './dictionary.schema.js';
import {
  createDictionary,
  createDictionaryItem,
  deleteDictionary,
  deleteDictionaryItem,
  getDictionary,
  getDictionaryByKey,
  getDictionaryItem,
  getDictionaryItems,
  listDictionaries,
  updateDictionary,
  updateDictionaryItem,
} from './dictionary.repository.js';

export async function listDictionariesService(query: DictionaryListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['key', 'name', 'createdAt'], 'key');
  const result = await listDictionaries({
    q: query.q,
    enabled: query.enabled,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function getDictionaryService(id: string) {
  const dictionary = await getDictionary(id);
  if (!dictionary) throw new NotFoundError('Dictionary not found');
  return { ...dictionary, items: await getDictionaryItems(id) };
}

export async function getDictionaryByKeyService(key: string, enabledOnly = true) {
  const dictionary = await getDictionaryByKey(key);
  if (!dictionary || (enabledOnly && !dictionary.isEnabled)) throw new NotFoundError('Dictionary not found');
  return { ...dictionary, items: await getDictionaryItems(dictionary.id, enabledOnly) };
}

export async function createDictionaryService(request: FastifyRequest, input: CreateDictionaryBody) {
  if (await getDictionaryByKey(input.key)) throw new ConflictError('Dictionary key already exists');
  const dictionary = await createDictionary(input);
  await writeAudit(request, { action: 'create', resource: 'dictionary', resourceId: dictionary.id });
  return getDictionaryService(dictionary.id);
}

export async function updateDictionaryService(request: FastifyRequest, id: string, input: UpdateDictionaryBody) {
  const dictionary = await getDictionary(id);
  if (!dictionary) throw new NotFoundError('Dictionary not found');
  const updated = await updateDictionary(id, input);
  if (!updated) throw new NotFoundError('Dictionary not found');
  await writeAudit(request, { action: 'update', resource: 'dictionary', resourceId: id });
  return getDictionaryService(id);
}

export async function deleteDictionaryService(request: FastifyRequest, id: string) {
  const dictionary = await getDictionary(id);
  if (!dictionary) throw new NotFoundError('Dictionary not found');
  if (dictionary.isSystem) throw new ForbiddenError('System dictionary cannot be deleted');
  await deleteDictionary(id);
  await writeAudit(request, { action: 'delete', resource: 'dictionary', resourceId: id });
  return { deleted: true };
}

export async function createDictionaryItemService(request: FastifyRequest, dictionaryId: string, input: CreateDictionaryItemBody) {
  const dictionary = await getDictionary(dictionaryId);
  if (!dictionary) throw new NotFoundError('Dictionary not found');
  const item = await createDictionaryItem({ dictionaryId, ...input });
  await writeAudit(request, { action: 'create_item', resource: 'dictionary', resourceId: dictionaryId, metadata: { itemId: item.id } });
  return item;
}

export async function updateDictionaryItemService(request: FastifyRequest, itemId: string, input: UpdateDictionaryItemBody) {
  const item = await getDictionaryItem(itemId);
  if (!item) throw new NotFoundError('Dictionary item not found');
  const updated = await updateDictionaryItem(itemId, input);
  if (!updated) throw new NotFoundError('Dictionary item not found');
  await writeAudit(request, {
    action: 'update_item',
    resource: 'dictionary',
    resourceId: item.dictionaryId,
    metadata: { itemId },
  });
  return updated;
}

export async function deleteDictionaryItemService(request: FastifyRequest, itemId: string) {
  const item = await getDictionaryItem(itemId);
  if (!item) throw new NotFoundError('Dictionary item not found');
  await deleteDictionaryItem(itemId);
  await writeAudit(request, {
    action: 'delete_item',
    resource: 'dictionary',
    resourceId: item.dictionaryId,
    metadata: { itemId },
  });
  return { deleted: true };
}
