import type { GeneratorPreviewBody, ProjectPreviewBody } from './generator.schema.js';

export type GeneratedFile = {
  path: string;
  content: string;
};

function toPascalCase(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function toSnakeCase(name: string): string {
  return name.replaceAll('-', '_');
}

export function buildModulePreview(input: GeneratorPreviewBody): { module: string; resource: string; tableName: string; files: GeneratedFile[] } {
  const moduleName = input.name;
  const resource = input.resource ?? moduleName;
  const tableName = input.tableName ?? toSnakeCase(moduleName);
  const pascal = toPascalCase(moduleName);
  const camel = toCamelCase(moduleName);
  const dir = `src/modules/${moduleName}`;

  const files: GeneratedFile[] = [
    {
      path: `${dir}/${moduleName}.schema.ts`,
      content: `import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';

export const ${camel}ListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
});

export const create${pascal}BodySchema = z.object({
  name: z.string().min(1).max(120),
});

export const update${pascal}BodySchema = create${pascal}BodySchema.partial();

export type ${pascal}ListQuery = z.infer<typeof ${camel}ListQuerySchema>;
export type Create${pascal}Body = z.infer<typeof create${pascal}BodySchema>;
export type Update${pascal}Body = z.infer<typeof update${pascal}BodySchema>;
`,
    },
    {
      path: `${dir}/${moduleName}.repository.ts`,
      content: `// Add a Drizzle table for "${tableName}" in src/db/schema.ts before using this repository.
export async function list${pascal}s() {
  return [];
}
`,
    },
    {
      path: `${dir}/${moduleName}.service.ts`,
      content: `import { getPagination, paged } from '../../shared/pagination.js';
import type { ${pascal}ListQuery } from './${moduleName}.schema.js';
import { list${pascal}s } from './${moduleName}.repository.js';

export async function list${pascal}sService(query: ${pascal}ListQuery) {
  const pagination = getPagination(query);
  const items = await list${pascal}s();
  return paged(items, items.length, pagination.page, pagination.pageSize);
}
`,
    },
    {
      path: `${dir}/${moduleName}.route.ts`,
      content: `import type { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response.js';
import { ${camel}ListQuerySchema, type ${pascal}ListQuery } from './${moduleName}.schema.js';
import { list${pascal}sService } from './${moduleName}.service.js';

export async function ${camel}Routes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [app.authorize('${resource}:list')],
      schema: { tags: ['${moduleName}'], querystring: ${camel}ListQuerySchema, security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => ok(reply, request, await list${pascal}sService(request.query as ${pascal}ListQuery)),
  );
}
`,
    },
  ];

  return {
    module: moduleName,
    resource,
    tableName,
    files,
  };
}

export function buildProjectPreview(input: ProjectPreviewBody): { project: string; files: GeneratedFile[] } {
  const packageName = input.packageName ?? input.name;
  const files: GeneratedFile[] = [
    {
      path: `${input.name}/package.json`,
      content: `${JSON.stringify(
        {
          name: packageName,
          version: '0.1.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'tsx watch src/server.ts',
            build: 'tsc -p tsconfig.json',
            start: 'node dist/server.js',
          },
          dependencies: {
            fastify: '^5.6.2',
            zod: '^4.1.13',
          },
          devDependencies: {
            tsx: '^4.21.0',
            typescript: '^5.9.3',
          },
        },
        null,
        2,
      )}
`,
    },
    {
      path: `${input.name}/README.md`,
      content: `# ${input.name}

${input.description}

Generated from nax-api scaffold preview. Copy the pieces you need or use the CLI with --write.
`,
    },
    {
      path: `${input.name}/src/server.ts`,
      content: `import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/api/v1/health', async () => ({ success: true, data: { status: 'ok' }, message: 'ok' }));

await app.listen({ host: '0.0.0.0', port: 3000 });
`,
    },
    {
      path: `${input.name}/tsconfig.json`,
      content: `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
            esModuleInterop: true,
            outDir: 'dist',
            rootDir: 'src',
          },
          include: ['src/**/*.ts'],
        },
        null,
        2,
      )}
`,
    },
  ];

  return {
    project: input.name,
    files,
  };
}
