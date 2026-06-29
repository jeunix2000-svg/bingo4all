# Bingo4All

独立部署的派对宾果（Bingo）主持与观战应用，从 [html](https://github.com/jeunix2000-svg/html) 门户拆分而来。

## 功能

- 主持端抽号、主盘、数字卡、观战 QR 码
- 多设备跨端同步（最多 10 场并行游戏）
- 观战模式与实时抽号动画同步
- 24/7 服务器演示局（不占用户 10 场上限）
- 日 / 中 / EN 语言切换

## 仓库结构

```
├── index.html          # 主页面
├── bingo.js            # 游戏逻辑
├── bingo-config.js     # 部署 URL 配置
├── i18n.js / i18n.css  # 多语言
├── celebrate.js        # 庆祝动画
├── screen-effects.js   # 连击特效
├── qrcode.min.js       # 观战 QR
├── api/                # Node 同步 API（Render Web Service）
│   ├── server.js
│   ├── demoGame.js
│   └── data/
└── render.yaml         # Render Blueprint
```

## 本地开发

### 前端

用任意静态服务器打开仓库根目录，例如：

```bash
npx serve .
```

编辑 `bingo-config.js`，将 `bingoSyncUrl` 指向本地 API（默认 `http://localhost:8080`）。

### API

```bash
cd api
npm install
APP_ORIGIN=http://localhost:3000 npm start
```

健康检查：`GET http://localhost:8080/health`

## Render 部署

### 方式 A：Blueprint（推荐）

1. Render Dashboard → **New** → **Blueprint**
2. 连接本仓库 `jeunix2000-svg/bingo4all`
3. 应用 `render.yaml`，会创建：
   - **bingo4all** — 静态站点
   - **bingo4all-api** — Node API

### 方式 B：手动

**静态站点**

- New → Static Site → 本仓库，Publish directory: `.`（根目录）

**API**

- New → Web Service → 本仓库，Root Directory: `api`
- Build: `npm install`，Start: `npm start`
- Health check path: `/health`
- 环境变量 `APP_ORIGIN` = 静态站点公网 URL（如 `https://bingo4all.onrender.com`）

### 部署后配置

在 `bingo-config.js` 中更新（或通过构建脚本注入）：

```javascript
window.BINGO4ALL_CONFIG = {
  appBaseUrl: 'https://你的静态站.onrender.com',
  bingoSyncUrl: 'https://你的-api.onrender.com',
};
```

重新部署静态站点使配置生效。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/` 或 `/api/games` | 获取全部游戏状态 |
| POST | `/` 或 `/api/games` | 合并上传游戏状态 |

## 从 html 门户迁移说明

本仓库包含原 `html` 项目中 bingo 的完整前端与 `bingo-api` 后端。门户 `html` 仓库中的 bingo 页面可在 Bingo4All 稳定运行后移除。
