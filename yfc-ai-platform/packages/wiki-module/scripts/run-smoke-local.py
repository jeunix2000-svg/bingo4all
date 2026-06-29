#!/usr/bin/env python3
# scripts/run-smoke-local.py
# docker非搭載環境でも「真実のPostgres」に対し端到端冒烟を実行する。
# 本番は docker-compose（pgvector/pgvector:pg16）で同じ migrations + smoke.mjs を実行する。
import pgserver, tempfile, subprocess, os, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]   # repo root
MIG = ROOT / "db" / "migrations"

def portable(sql: str) -> str:
    # このサンドボックスのPostgresは citext/pgcrypto 拡張が無い（Azure/dockerには有る）。
    # vector拡張は有るのでそのまま使う。gen_random_uuid はコア関数。
    sql = sql.replace("CREATE EXTENSION IF NOT EXISTS citext;", "")
    sql = sql.replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "")
    sql = sql.replace("CITEXT", "TEXT")
    return sql

def main():
    d = tempfile.mkdtemp()
    srv = pgserver.get_server(d)
    print("[db] PostgreSQL started")
    for f in ["V1__core_schema.sql", "V2__points.sql", "V3__platform_pgvector.sql"]:
        srv.psql(portable((MIG / f).read_text(encoding="utf-8")))
        print(f"[db] applied {f}")
    url = srv.get_uri()
    env = {**os.environ, "DATABASE_URL": url}
    smoke = ROOT / "packages" / "wiki-module" / "scripts" / "smoke.mjs"
    print("[smoke] running against real Postgres...\n")
    r = subprocess.run(
        ["node", "--import", "tsx", str(smoke)],
        cwd=str(ROOT / "packages" / "wiki-module"), env=env)
    srv.cleanup()
    sys.exit(r.returncode)

if __name__ == "__main__":
    main()
