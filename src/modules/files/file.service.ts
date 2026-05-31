import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getPagination, paged } from '../../shared/pagination.js';
import { writeAudit } from '../../shared/audit.js';
import type { FileListQuery } from './file.schema.js';
import { createFileRecord, listFiles } from './file.repository.js';

export async function listFilesService(query: FileListQuery) {
  const pagination = getPagination(query);
  const result = await listFiles({ q: query.q, limit: pagination.limit, offset: pagination.offset });
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

