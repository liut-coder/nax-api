import { describe, expect, it } from 'vitest';
import { getPagination, getSort, paged } from '../pagination.js';

describe('pagination helpers', () => {
  it('computes limit and offset', () => {
    expect(getPagination({ page: 3, pageSize: 20, sortOrder: 'desc' })).toEqual({
      page: 3,
      pageSize: 20,
      limit: 20,
      offset: 40,
    });
  });

  it('falls back to an allowed sort field', () => {
    expect(getSort({ page: 1, pageSize: 20, sortBy: 'bad', sortOrder: 'asc' }, ['name'], 'name')).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });

  it('wraps paged payloads', () => {
    expect(paged([1, 2], 5, 2, 2).pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 5,
      totalPages: 3,
    });
  });
});
