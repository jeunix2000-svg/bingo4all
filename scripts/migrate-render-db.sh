#!/usr/bin/env bash
# 对 Render Postgres 执行 Flyway 迁移（V1–V4，含门户演示用户）
# 用法:
#   DATABASE_URL='postgresql://user:pass@host:5432/dbname' bash scripts/migrate-render-db.sh
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "请设置 DATABASE_URL（Render Postgres → External Database URL）" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS="${ROOT}/yfc-ai-platform/db/migrations"

eval "$(python3 <<'PY'
import os
from urllib.parse import urlparse, unquote
p = urlparse(os.environ["DATABASE_URL"])
port = p.port or 5432
db = (p.path or "/").lstrip("/") or "postgres"
jdbc = f"jdbc:postgresql://{p.hostname}:{port}/{db}"
if p.query:
    jdbc += f"?{p.query}"
user = unquote(p.username or "")
password = unquote(p.password or "")
print(f'export JDBC_URL="{jdbc}"')
print(f'export PGUSER="{user}"')
print(f'export PGPASSWORD="{password}"')
PY
)"

echo "==> Flyway migrate → ${JDBC_URL%%\?*}"
docker run --rm \
  -v "${MIGRATIONS}:/flyway/sql" \
  -e FLYWAY_URL="$JDBC_URL" \
  -e FLYWAY_USER="$PGUSER" \
  -e FLYWAY_PASSWORD="$PGPASSWORD" \
  flyway/flyway:10 migrate

echo "==> 完成（含 V4 门户演示用户）"
