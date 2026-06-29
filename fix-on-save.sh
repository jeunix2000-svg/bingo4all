#!/bin/bash
# 在服务器上直接编辑时使用 — 保存后仅修复 Apache 权限，无需 scp
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/scripts/fix-permissions.sh" "${SCRIPT_DIR}"
