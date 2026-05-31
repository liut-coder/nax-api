import { createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import { NotFoundError } from '../../shared/errors.js';
import type { FileListQuery, FileUploadMeta } from './file.schema.js';
import { createFileRecord, deleteFile, getFile, getPublicFile, listFiles } from './file.repository.js';

export async function listFilesService(query: FileListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['createdAt', 'originalName', 'sizeBytes']);
  const result = await listFiles({
    q: query.q,
    category: query.category,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function uploadFileService(request: FastifyRequest, file: MultipartFile, meta: FileUploadMeta) {
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  const extension = file.filename.includes('.') ? `.${file.filename.split('.').pop()}` : '';
  const storedName = `${randomUUID()}${extension}`;
  const path = join(env.UPLOAD_DIR, storedName);
  try {
    await pipeline(file.file, createWriteStream(path, { flags: 'wx' }));
    const { size } = await stat(path);
    const record = await createFileRecord({
      originalName: file.filename,
      storedName,
      mimeType: file.mimetype,
      sizeBytes: size,
      path,
      category: meta.category,
      isPublic: meta.isPublic,
      uploadedBy: request.auth?.userId,
    });
    await writeAudit(request, { action: 'upload', resource: 'file', resourceId: record.id, metadata: meta });
    return record;
  } catch (error) {
    await unlink(path).catch(() => undefined);
    throw error;
  }
}

export async function getFileService(id: string) {
  const file = await getFile(id);
  if (!file) throw new NotFoundError('File not found');
  return file;
}

export async function getPublicFileService(id: string) {
  const file = await getPublicFile(id);
  if (!file) throw new NotFoundError('File not found');
  return file;
}

export async function deleteFileService(request: FastifyRequest, id: string) {
  const file = await getFileService(id);
  await deleteFile(id);
  await unlink(file.path).catch(() => undefined);
  await writeAudit(request, { action: 'delete', resource: 'file', resourceId: id });
  return { deleted: true };
}
