#!/usr/bin/env python3
# poc/run-api-e2e.py
# ApiEmbeddingProvider（実HTTP）+ 真pgvector の端到端検証を、外部API・鍵なしで実行する。
#   1) 真実PostgreSQL(pgvector) を起動
#   2) ローカルの OpenAI互換 埋め込みmockサーバを起動
#   3) ApiEmbeddingProvider が EMBEDDING_ENDPOINT(=mock) に実HTTPで接続して埋め込み→pgvector検索
# 本番は EMBEDDING_ENDPOINT/EMBEDDING_API_KEY/EMBEDDING_MODEL を実プロバイダに向けるだけ（コード変更不要）。
import pgserver, tempfile, subprocess, os, time, socket, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
POC = ROOT / "packages" / "platform-core" / "poc"

def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p

def wait_port(port, timeout=15):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), 0.3): return True
        except OSError: time.sleep(0.2)
    return False

def main():
    srv = pgserver.get_server(tempfile.mkdtemp())
    print("[db] PostgreSQL(pgvector) started")
    db_url = srv.get_uri()

    mock_port = free_port()
    mock = subprocess.Popen(["node", str(POC / "mock-embeddings-server.mjs")],
                            env={**os.environ, "MOCK_PORT": str(mock_port)})
    if not wait_port(mock_port):
        print("[mock] failed to start"); srv.cleanup(); sys.exit(1)
    print(f"[mock] OpenAI互換 embeddings mock on :{mock_port}")

    env = {**os.environ,
           "DATABASE_URL": db_url,
           "EMBEDDING_ENDPOINT": f"http://127.0.0.1:{mock_port}/v1/embeddings",
           "EMBEDDING_API_KEY": "sk-local-dummy-not-a-real-key",   # ローカルmock用のダミー
           "EMBEDDING_MODEL": "mock-embed-10",
           "EMBEDDING_DIM": "10"}
    try:
        r = subprocess.run(["node", "--import", "tsx", str(POC / "pgvector-api-e2e.mjs")],
                           cwd=str(ROOT), env=env)
        code = r.returncode
    finally:
        mock.terminate()
        srv.cleanup()
    sys.exit(code)

if __name__ == "__main__":
    main()
