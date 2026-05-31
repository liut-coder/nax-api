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
- Audit logs
- File upload
- Pagination helper
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

Health check:

```bash
curl http://localhost:3000/api/v1/health
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
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/roles`
- `POST /api/v1/roles`
- `GET /api/v1/permissions`
- `GET /api/v1/settings`
- `PUT /api/v1/settings/:key`
- `GET /api/v1/audit-logs`
- `GET /api/v1/files`
- `POST /api/v1/files/upload`

## Prototype Pack

The admin UI prototype assets are outside this backend repository:

```text
/root/nax-admin-prototype-pack.zip
```

The backend remains UI-agnostic, but the route and RBAC design follows the generic management-console needs shown in that prototype pack.

