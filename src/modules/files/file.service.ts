import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getPagination, getSort, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import { NotFoundError } from '../../shared/errors.js';
import type { FileListQuery } from './file.schema.js';
import { createFileRecord, deleteFile, getFile, listFiles } from './file.repository.js';

export async function listFilesService(query: FileListQuery) {
  const pagination = getPagination(query);
  const sort = getSort(query, ['createdAt', 'originalName', 'sizeBytes']);
  const result = await listFiles({
    q: query.q,
    createdAtFrom: query.createdAtFrom,
    createdAtTo: query.createdAtTo,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paged(result.items, result.total, pagination.page, pagination.pageSize);
}

export async function uploadFileService(request: FastifyRequest, file: MultipartFile) {
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  const extension = file.filename.includes('.') ? `.${file.filename.split('.').pop()}` : '';
  const storedName = `${randomUUID()}${extension}`;
  const path = join(env.UPLOAD_DIR, storedName);
  const buffer = await file.toBuffer();
  await writeFile(path, buffer);
  const record = await createFileRecord({
    originalName: file.filename,
    storedName,
    mimeType: file.mimetype,
    sizeBytes: buffer.length,
    path,
    uploadedBy: request.auth?.userId,
  });
  await writeAudit(request, { action: 'upload', resource: 'file', resourceId: record.id });
  return record;
}

export async function getFileService(id: string) {
  const file = await getFile(id);
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
