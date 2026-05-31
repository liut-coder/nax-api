import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';

vi.mock('../../shared/audit.js', () => ({
  writeAudit: vi.fn(),
}));

vi.mock('./dictionary.repository.js', () => ({
  createDictionary: vi.fn(),
  createDictionaryItem: vi.fn(),
  deleteDictionary: vi.fn(),
  deleteDictionaryItem: vi.fn(),
  getDictionary: vi.fn(),
  getDictionaryByKey: vi.fn(),
  getDictionaryItem: vi.fn(),
  getDictionaryItems: vi.fn(),
  listDictionaries: vi.fn(),
  updateDictionary: vi.fn(),
  updateDictionaryItem: vi.fn(),
}));

const repository = await import('./dictionary.repository.js');
const service = await import('./dictionary.service.js');

describe('dictionary service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists dictionaries with pagination and sort defaults', async () => {
    vi.mocked(repository.listDictionaries).mockResolvedValue({
      items: [{ id: 'dict-1', key: 'common.status', name: 'Status' }],
      total: 1,
    } as never);

    const result = await service.listDictionariesService({ page: 1, pageSize: 20, sortOrder: 'desc' });

    expect(repository.listDictionaries).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'key',
        sortOrder: 'desc',
        limit: 20,
        offset: 0,
      }),
    );
    expect(result.pagination.total).toBe(1);
  });

  it('hides disabled dictionaries from public key reads', async () => {
    vi.mocked(repository.getDictionaryByKey).mockResolvedValue({
      id: 'dict-1',
      key: 'demo',
      isEnabled: false,
    } as never);

    await expect(service.getDictionaryByKeyService('demo')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('prevents deleting system dictionaries', async () => {
    vi.mocked(repository.getDictionary).mockResolvedValue({
      id: 'dict-1',
      key: 'common.status',
      isSystem: true,
    } as never);

    await expect(service.deleteDictionaryService({} as never, 'dict-1')).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.deleteDictionary).not.toHaveBeenCalled();
  });
});
