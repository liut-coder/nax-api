#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d-%H%M%S)"
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/nax-api-$timestamp.sql"
echo "$BACKUP_DIR/nax-api-$timestamp.sql"
