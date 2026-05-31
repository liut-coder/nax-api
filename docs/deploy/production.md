# Production Deployment

This project can run as a plain Node.js service behind Nginx or a cloud load balancer.

## Prerequisites

- Node.js 22+
- PostgreSQL 14+
- A process manager such as systemd

## Build

```bash
npm ci
npm run build
npm run db:migrate
npm run seed
```

Initialize the first administrator if needed:

```bash
ADMIN_PASSWORD='change-this-password' npm run admin:init
```

## systemd

Create `/etc/systemd/system/nax-api.service`:

```ini
[Unit]
Description=NAX API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/nax-api
EnvironmentFile=/opt/nax-api/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
User=www-data
Group=www-data
StandardOutput=append:/var/log/nax-api/app.log
StandardError=append:/var/log/nax-api/error.log

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
mkdir -p /var/log/nax-api
chown www-data:www-data /var/log/nax-api
systemctl daemon-reload
systemctl enable nax-api
systemctl start nax-api
systemctl status nax-api
```

## Health Checks

- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready`

## Nginx

Forward HTTPS traffic to the API:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Set these production env values:

```text
NODE_ENV=production
COOKIE_SECURE=true
CORS_ORIGIN=https://your-admin.example.com
```

## Backup

Use `scripts/backup-postgres.sh` with `DATABASE_URL` set in the environment.
