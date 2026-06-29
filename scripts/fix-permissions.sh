#!/bin/bash
# 修复 Apache 可读权限与 SELinux 上下文
set -euo pipefail

WEB_ROOT="${1:-/var/www/html}"
APACHE_USER="apache"
APACHE_GROUP="apache"

if [[ ! -d "$WEB_ROOT" ]]; then
  echo "错误: 目录不存在 — $WEB_ROOT" >&2
  exit 1
fi

echo "[权限] 修复 $WEB_ROOT ..."

# 目录 755，文件 644
find "$WEB_ROOT" -type d -exec chmod 755 {} +
find "$WEB_ROOT" -type f -exec chmod 644 {} +

# 脚本保持可执行
find "$WEB_ROOT" -type f -name "*.sh" -exec chmod 755 {} +

# 静态内容由 apache 用户读取（RHEL 推荐）
chown -R "${APACHE_USER}:${APACHE_GROUP}" "$WEB_ROOT"

# Bingo 共享状态目录需 apache 可写
if [[ -d "$WEB_ROOT/data" ]]; then
  chmod 775 "$WEB_ROOT/data"
  if [[ -f "$WEB_ROOT/data/bingo-games.json" ]]; then
    chmod 664 "$WEB_ROOT/data/bingo-games.json"
  fi
fi

# SELinux：确保 httpd 可访问
if command -v restorecon &>/dev/null && [[ "$(getenforce 2>/dev/null)" != "Disabled" ]]; then
  restorecon -Rv "$WEB_ROOT"
fi

# 验证 Apache 配置（无需重启，静态 HTML 变更即时生效）
if command -v httpd &>/dev/null; then
  httpd -t 2>/dev/null && echo "[权限] Apache 配置检查通过"
fi

echo "[权限] 完成"
