# Bingo 迁移到 bingo4all 仓库

Bingo 完整代码已整理在 [`bingo4all-export/`](../bingo4all-export/) 目录，可推送到独立仓库：

https://github.com/jeunix2000-svg/bingo4all

## 一、推送到 bingo4all（首次）

在本地或 CI 有 `bingo4all` 写权限的机器上执行：

```bash
# 若尚未克隆 bingo4all
git clone https://github.com/jeunix2000-svg/bingo4all.git
cd bingo4all

# 从 html 仓库复制全部文件（在 html 仓库根目录执行）
rsync -av --delete /path/to/html/bingo4all-export/ ./

git add -A
git commit -m "Initial Bingo4All: migrated from html portal"
git push origin main
```

或使用本仓库内已准备好的镜像（含 git 历史）：

```bash
cd /path/to/html/bingo4all-mirror
git push origin main   # 需对 jeunix2000-svg/bingo4all 有 push 权限
```

> Cloud Agent 当前对 `bingo4all` 仓库无 push 权限，需你在 GitHub 邀请协作者或本地推送。

## 二、Render 部署

1. Render → **New** → **Blueprint** → 连接 `jeunix2000-svg/bingo4all`
2. 应用 `render.yaml`，创建：
   - **bingo4all** — 静态站点（仓库根目录）
   - **bingo4all-api** — Node API（`api/`）
3. 部署完成后，编辑 `bingo-config.js`：
   - `appBaseUrl` → 静态站 URL（如 `https://bingo4all.onrender.com`）
   - `bingoSyncUrl` → API URL（如 `https://bingo4all-api.onrender.com`）
4. 在 API 服务设置环境变量 `APP_ORIGIN` = 静态站 URL（CORS）
5. 重新部署静态站点

验证：

- `GET https://<api>/health` → `{"status":"ok"}`
- 打开静态站，创建游戏，另一设备可观战

## 三、从 html 门户移除 Bingo（API 稳定后）

确认 Bingo4All 独立运行后，在 `html` 仓库删除：

| 删除项 | 说明 |
|--------|------|
| `bingo.html`, `bingo.js` | 前端页面 |
| `bingo-api/` | 旧 API（Render 上可停用 `yfc-bingo-api`） |
| `scripts/bingo-games.php`, `data/bingo-games.json` | 旧 PHP 同步 |
| `index.html` 等页中的宾果卡片/导航链接 | 门户入口 |
| `portal-config.js` 中 `bingoSyncUrl` | 配置项 |
| `render.yaml` 中 `yfc-bingo-api` 服务 | Blueprint |
| `portal-i18n.js` 中 `bingo.*` 键（可选） | 翻译 |

门户首页可改为指向 Bingo4All 外链，例如：

```html
<a href="https://bingo4all.onrender.com">Bingo4All</a>
```

## 四、bingo4all 仓库结构

```
index.html          主页面（原 bingo.html）
bingo.js            游戏逻辑
bingo-config.js     部署 URL
i18n.js / i18n.css  日/中/EN
api/                Node 同步 API + 24h 演示局
render.yaml         Render Blueprint
```
