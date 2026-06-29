# Bingo4All

派对宾果（Bingo）主持与观战应用，部署在 [Render](https://render.com)。

打开站点即进入**大厅**：可「开始新游戏」或「观战进行中的游戏」。最多同时进行 10 场游戏，另含 24/7 服务器演示局。

## 功能

- 主持端抽号、主盘、数字卡、观战 QR 码
- 多设备跨端同步（最多 20 场并行游戏）
- 观战模式与实时抽号动画同步
- 24/7 服务器演示局（不占用户 20 场上限）
- 日 / 中 / EN 语言切换

## 仓库结构

```
├── index.html          # 大厅 + 游戏主页面
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

### Blueprint（推荐）

1. Render Dashboard → **New** → **Blueprint**
2. 连接本仓库 `jeunix2000-svg/bingo4all`
3. 应用 `render.yaml`，会创建：
   - **bingo4all** — 静态站点（根目录）
   - **bingo4all-api** — Node 同步 API

### 部署后配置

在 `bingo-config.js` 中更新为你的 Render 公网地址：

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
