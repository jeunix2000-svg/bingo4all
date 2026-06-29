#!/bin/bash
# Docusaurus WIKI をビルドし、ポータル公開用 wiki/ に配置
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WIKI_SITE="${ROOT_DIR}/wiki-site"
WIKI_OUT="${ROOT_DIR}/wiki"

if ! command -v npm &>/dev/null; then
  echo "错误: 未找到 npm。请先安装 Node.js 18+" >&2
  exit 1
fi

echo "==> 安装依赖 (wiki-site)"
cd "$WIKI_SITE"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> 构建 Docusaurus"
npm run build

echo "==> 复制到 ${WIKI_OUT}"
rm -rf "$WIKI_OUT"
mkdir -p "$WIKI_OUT"
cp -r build/* "$WIKI_OUT/"

echo "==> WIKI 构建完成: ${WIKI_OUT}/"
echo "    访问路径: /wiki/"
