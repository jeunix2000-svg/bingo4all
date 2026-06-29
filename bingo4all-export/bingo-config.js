/**
 * Bingo4All 部署配置
 * 在 Render 创建 API 后，将 bingoSyncUrl 改为你的 API 公网地址。
 * appBaseUrl 为静态站点公网地址（用于主持端 QR 码观战链接）。
 */
window.BINGO4ALL_CONFIG = {
  /** 静态站点根 URL，末尾不要加 / */
  appBaseUrl: 'https://bingo4all.onrender.com',
  /** Bingo 同步 API（Render Web Service 根地址） */
  bingoSyncUrl: 'https://bingo4all-api.onrender.com',
};
