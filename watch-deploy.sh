#!/bin/bash
# 监听本地文件变更，自动触发 deploy.sh（适合本地开发机后台运行）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCH_DIR="${WATCH_DIR:-$SCRIPT_DIR}"
INTERVAL="${INTERVAL:-2}"
STAMP_FILE="/tmp/watch-deploy.stamp"

cd "$WATCH_DIR"

echo "监听目录: $WATCH_DIR（每 ${INTERVAL}s 检查一次，Ctrl+C 停止）"
touch "$STAMP_FILE"

deploy_if_changed() {
  local changed
  changed=$(find "$WATCH_DIR" -maxdepth 1 \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -newer "$STAMP_FILE" -print -quit 2>/dev/null)
  if [[ -n "$changed" ]]; then
    echo "[$(date '+%H:%M:%S')] 检测到变更: $changed"
    bash "$SCRIPT_DIR/deploy.sh"
    touch "$STAMP_FILE"
  fi
}

# 若安装了 inotify-tools，使用更高效的事件监听
if command -v inotifywait &>/dev/null; then
  echo "使用 inotifywait 实时监听..."
  inotifywait -m -e close_write,moved_to,create \
    --format '%w%f' \
    "$WATCH_DIR" 2>/dev/null | while read -r filepath; do
    case "$filepath" in
      *.html|*.css|*.js)
        echo "[$(date '+%H:%M:%S')] 检测到变更: $filepath"
        bash "$SCRIPT_DIR/deploy.sh"
        touch "$STAMP_FILE"
        ;;
    esac
  done
else
  echo "提示: 安装 inotify-tools 可获得更快的响应（dnf install -y inotify-tools）"
  while true; do
    deploy_if_changed
    sleep "$INTERVAL"
  done
fi
