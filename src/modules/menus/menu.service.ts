import type { FastifyRequest } from 'fastify';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { CreateMenuBody, MenuListQuery, UpdateMenuBody } from './menu.schema.js';
import {
  createMenu,
  deleteMenu,
  getMenu,
  getMenuByKey,
  hasChildren,
  listMenuTreeRows,
  listMenus,
  updateMenu,
} from './menu.repository.js';

type MenuRow = Awaited<ReturnType<typeof listMenuTreeRows>>[number];
type MenuTreeNode = MenuRow & { children: MenuTreeNode[] };

function buildMenuTree(rows: MenuRow[]): MenuTreeNode[] {
  const byParent = new Map<string | null, MenuRow[]>();
  for (const row of rows) {
    const parentId = row.parentId ?? null;
    const current = byParent.get(parentId) ?? [];
    current.push(row);
    byParent.set(parentId, current);
  }

  const build = (parentId: string | null): MenuTreeNode[] =>
    (byParent.get(parentId) ?? []).map((menu) => ({ ...menu, children: build(menu.id) }));

  return build(null);
}

export async function listMenusService(query: MenuListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['key', 'title', 'sortOrder', 'createdAt'], 'sortOrder');
  const result = await listMenus({
    q: query.q,
    parentId: query.parentId,
    visible: query.visible,
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

export async function menuTreeService(enabledOnly = false) {
  return buildMenuTree(await listMenuTreeRows(enabledOnly));
}

export async function getMenuService(id: string) {
  const menu = await getMenu(id);
  if (!menu) throw new NotFoundError('Menu not found');
  return menu;
}

export async function createMenuService(request: FastifyRequest, input: CreateMenuBody) {
  if (await getMenuByKey(input.key)) throw new ConflictError('Menu key already exists');
  if (input.parentId && !(await getMenu(input.parentId))) throw new NotFoundError('Parent menu not found');
  const menu = await createMenu(input);
  await writeAudit(request, { action: 'create', resource: 'menu', resourceId: menu.id });
  return menu;
}

export async function updateMenuService(request: FastifyRequest, id: string, input: UpdateMenuBody) {
  const menu = await getMenu(id);
  if (!menu) throw new NotFoundError('Menu not found');
  if (input.parentId === id) throw new ConflictError('Menu cannot be its own parent');
  if (input.parentId && !(await getMenu(input.parentId))) throw new NotFoundError('Parent menu not found');
  const updated = await updateMenu(id, input);
  if (!updated) throw new NotFoundError('Menu not found');
  await writeAudit(request, { action: 'update', resource: 'menu', resourceId: id });
  return updated;
}

export async function deleteMenuService(request: FastifyRequest, id: string) {
  const menu = await getMenu(id);
  if (!menu) throw new NotFoundError('Menu not found');
  if (await hasChildren(id)) throw new ConflictError('Menu has children');
  await deleteMenu(id);
  await writeAudit(request, { action: 'delete', resource: 'menu', resourceId: id });
  return { deleted: true };
}
