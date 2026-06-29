#!/bin/bash
# 将本地 index.html 等文件同步到远程 Apache 服务器
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${SCRIPT_DIR}/deploy.config"

if [[ -f "$CONFIG" ]]; then
  # shellcheck source=/dev/null
  source "$CONFIG"
fi

REMOTE_HOST="${REMOTE_HOST:-192.168.211.34}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/html}"
SYNC_FILES="${SYNC_FILES:-index.html}"
SSH_OPTS="${SSH_OPTS:-}"

REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
SSH_CMD=(ssh ${SSH_OPTS:+$SSH_OPTS} "$REMOTE")
SCP_CMD=(scp ${SSH_OPTS:+$SSH_OPTS})

echo "==> 部署到 ${REMOTE}:${REMOTE_DIR}"

# 收集待同步文件
shopt -s nullglob
files=()
for pattern in $SYNC_FILES; do
  for f in $pattern; do
    [[ -f "$f" ]] && files+=("$f")
  done
done
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
  echo "错误: 未找到待同步文件（SYNC_FILES=$SYNC_FILES）" >&2
  exit 1
fi

# 优先 rsync，回退 scp
if command -v rsync &>/dev/null; then
  RSYNC_SSH="ssh ${SSH_OPTS}"
  rsync -avz --delete-excluded \
    -e "$RSYNC_SSH" \
    "${files[@]}" \
    "${REMOTE}:${REMOTE_DIR}/"
else
  echo "提示: 未安装 rsync，使用 scp"
  "${SCP_CMD[@]}" "${files[@]}" "${REMOTE}:${REMOTE_DIR}/"
fi

# 远程修复 Apache 权限
"${SSH_CMD[@]}" "bash ${REMOTE_DIR}/scripts/fix-permissions.sh ${REMOTE_DIR}"

echo "==> 部署完成: http://${REMOTE_HOST}/"
