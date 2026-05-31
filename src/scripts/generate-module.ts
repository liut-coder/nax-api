import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generatorPreviewBodySchema, projectPreviewBodySchema } from '../modules/generator/generator.schema.js';
import { buildModulePreview, buildProjectPreview, type GeneratedFile } from '../modules/generator/generator.service.js';

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value?.slice(prefix.length);
}

async function writeGeneratedFiles(files: GeneratedFile[]): Promise<void> {
  for (const file of files) {
    const path = resolve(process.cwd(), file.path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file.content, { flag: 'wx' });
  }
}

async function main(): Promise<void> {
  const type = getArg('type') ?? 'module';
  const write = hasFlag('--write');
  const name = getArg('name') ?? process.argv.at(2);
  if (!name) throw new Error('Usage: npm run generate:module -- --name=demo-module [--write]');

  const result =
    type === 'project'
      ? buildProjectPreview(projectPreviewBodySchema.parse({ name, description: getArg('description') ?? undefined, packageName: getArg('packageName') }))
      : buildModulePreview(generatorPreviewBodySchema.parse({ name, tableName: getArg('tableName'), resource: getArg('resource') }));

  if (write) {
    await writeGeneratedFiles(result.files);
    console.log(`generated ${result.files.length} files`);
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
