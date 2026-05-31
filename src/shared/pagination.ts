import { z } from 'zod';

export const booleanQuerySchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value;
}, z.boolean());

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function getPagination(query: PaginationQuery): { limit: number; offset: number; page: number; pageSize: number } {
  const page = query.page;
  const pageSize = query.pageSize;
  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function getSort(query: PaginationQuery, allowed: readonly string[], fallback = 'createdAt') {
  const sortBy = query.sortBy && allowed.includes(query.sortBy) ? query.sortBy : fallback;
  return {
    sortBy,
    sortOrder: query.sortOrder,
  };
}

export function paged<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
