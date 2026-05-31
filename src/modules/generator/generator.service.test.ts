import { describe, expect, it } from 'vitest';
import { buildModulePreview, buildProjectPreview } from './generator.service.js';

describe('generator preview', () => {
  it('builds a safe module preview without writing files', () => {
    const preview = buildModulePreview({ name: 'demo-task' });

    expect(preview.module).toBe('demo-task');
    expect(preview.tableName).toBe('demo_task');
    expect(preview.files.map((file) => file.path)).toContain('src/modules/demo-task/demo-task.route.ts');
    expect(preview.files.every((file) => file.content.length > 0)).toBe(true);
  });

  it('builds a lightweight project preview', () => {
    const preview = buildProjectPreview({ name: 'demo-api', description: 'Demo API' });

    expect(preview.project).toBe('demo-api');
    expect(preview.files.map((file) => file.path)).toContain('demo-api/package.json');
  });
});
