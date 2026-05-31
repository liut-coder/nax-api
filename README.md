# nax-api

Reusable lightweight management backend API scaffold.

This project is intentionally generic. It can be reused for infra-control, HMN, script management platforms and other admin backends without binding to a specific business domain.

## Stack

- Node.js 22+
- TypeScript
- Fastify
- Drizzle ORM
- PostgreSQL
- Zod
- JWT access token
- Refresh token with HttpOnly cookie
- argon2 password hashing
- Swagger / OpenAPI
- Pino logging
- Docker Compose

## Features

- Standard module layout: `route`, `schema`, `service`, `repository`
- Environment variable validation
- PostgreSQL connection
- Drizzle schema and SQL migration
- Unified success/error response format
- Global error handling
- Request ID: `req_xxx`
- Pino logger
- Swagger UI
- Health check
- Users, roles, permissions
- User-role and role-permission relations
- RBAC permission guard
- System settings
- Data dictionaries
- Editable public base information
- Menu management and current-user menu tree
- Dashboard overview
- Session management
- Audit logs
- File upload, download and delete
- Pagination helper
- Safe generator preview API and explicit CLI file generation
- Admin initialization script
- Seed script

## Directory Layout

```text
src/
  app.ts
  server.ts
  routes.ts
  config/
  db/
  shared/
  modules/
    auth/
      auth.route.ts
      auth.schema.ts
      auth.service.ts
      auth.repository.ts
    users/
    roles/
    permissions/
    settings/
    menus/
    dictionaries/
    dashboard/
    system/
    sessions/
    generator/
    audit/
    files/
    health/
  scripts/
drizzle/
```

Routes never access the database directly. Database operations live in repositories.

## API Prefix

All business APIs are under:

```text
/api/v1
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Response Format

Success:

```json
{
  "success": true,
  "data": {},
  "message": "ok",
  "requestId": "req_xxx"
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "requestId": "req_xxx"
}
```

## Permissions

Permission keys use:

```text
resource:action
```

Examples:

```text
user:list
user:create
role:update
setting:update
```

Default roles:

- `admin`
- `operator`
- `viewer`

## Local Development

Install dependencies:

```bash
npm install
```

Create local env:

```bash
cp .env.example .env
```

Start PostgreSQL only:

```bash
docker compose up -d postgres
```

Run migrations:

```bash
npm run db:migrate
```

Seed roles and permissions:

```bash
npm run seed
```

Initialize the default administrator:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_USERNAME=admin \
ADMIN_DISPLAY_NAME=Administrator \
ADMIN_PASSWORD='ChangeMe123!' \
npm run admin:init
```

Start the API:

```bash
npm run dev
```

Health checks:

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
```

Swagger:

```text
http://localhost:3000/docs
```

## Docker

Start PostgreSQL and API:

```bash
docker compose up -d --build
```

Run migrations inside the API container:

```bash
docker compose exec api npm run db:migrate
```

Seed data:

```bash
docker compose exec api npm run seed
```

Initialize admin:

```bash
docker compose exec \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_DISPLAY_NAME=Administrator \
  -e ADMIN_PASSWORD='ChangeMe123!' \
  api npm run admin:init
```

## Production

See [docs/deploy/production.md](docs/deploy/production.md) for a systemd and Nginx deployment example.

## Login

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"admin@example.com","password":"ChangeMe123!"}'
```

The response contains an access token. The refresh token is set as an HttpOnly cookie.

## Authenticated Request

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <access_token>"
```

## Core Endpoints

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/profile`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:id`
- `GET /api/v1/auth/menus`
- `GET /api/v1/system/base-info`
- `GET /api/v1/public/files/:id`
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/roles`
- `POST /api/v1/roles`
- `GET /api/v1/permissions`
- `GET /api/v1/menus/tree`
- `GET /api/v1/settings`
- `PUT /api/v1/settings/:key`
- `GET /api/v1/dictionaries`
- `GET /api/v1/audit-logs/export.csv`
- `GET /api/v1/sessions`
- `DELETE /api/v1/sessions/:id`
- `POST /api/v1/files/upload`
- `GET /api/v1/files`
- `GET /api/v1/files/:id/download`
- `DELETE /api/v1/files/:id`
- `POST /api/v1/generator/modules/preview`
- `POST /api/v1/generator/projects/preview`

## Security

- Global rate limit is controlled by `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW`.
- Login route rate limit is controlled by `LOGIN_RATE_LIMIT_MAX`.
- Repeated login failures are locked per account and IP with `LOGIN_FAILURE_LIMIT` and `LOGIN_FAILURE_WINDOW_SECONDS`.
- `COOKIE_SECURE=true` should be used behind HTTPS in production.

## Base Information

Public frontend bootstrap data is available without authentication:

```bash
curl http://localhost:3000/api/v1/system/base-info
```

The values come from editable `system_settings` rows in group `base`, for example:

- `base.name`
- `base.logoUrl`
- `base.adminName`
- `base.adminLogoUrl`
- `base.loginBackgroundUrl`
- `base.homeBackgroundUrl`
- `base.faviconUrl`
- `base.version`
- `base.loginTitle`
- `base.loginSubtitle`
- `base.projectDescription`
- `base.copyright`
- `base.supportUrl`
- `base.defaultLanguage`
- `base.theme`

Admins can update them through:

```text
PUT /api/v1/settings/:key
```

## Branding Assets

Upload public branding assets with the authenticated file upload endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/files/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@logo.png" \
  -F "category=branding" \
  -F "isPublic=true"
```

The response returns the file `id`. Public files can then be read without authentication:

```text
GET /api/v1/public/files/:id
```

Use that public URL as the value of branding settings such as `base.logoUrl`, `base.adminLogoUrl`, `base.loginBackgroundUrl`, `base.homeBackgroundUrl` and `base.faviconUrl`.

## Generator

Preview a module from API:

```bash
curl -X POST http://localhost:3000/api/v1/generator/modules/preview \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"demo-task"}'
```

CLI defaults to preview output and writes files only with `--write`:

```bash
npm run generate:module -- --name=demo-task
npm run generate:module -- --name=demo-task --write
npm run generate:module -- --type=project --name=demo-api
```

## Prototype Pack

The admin UI prototype assets are outside this backend repository:

```text
/root/nax-admin-prototype-pack.zip
```

The backend remains UI-agnostic, but the route and RBAC design follows the generic management-console needs shown in that prototype pack.
