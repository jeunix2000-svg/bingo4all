/**
 * Portal i18n — 日本語 / 中文 / English
 * Mark static text: data-i18n="key"
 * Placeholders: data-i18n-placeholder="key"
 * Page title: <meta name="portal-i18n-title" content="page.title_key">
 */
(function () {
  const STORAGE_KEY = "portal_lang";
  const DEFAULT_LANG = "ja";
  const LANGS = ["ja", "zh", "en"];

  const M = {
    "common.back": { ja: "← ポータルへ戻る", zh: "← 返回门户", en: "← Back to Portal" },
    "common.logo": { ja: "Users Portal", zh: "用户门户", en: "Users Portal" },
    "common.nav_ict": { ja: "ICT営業管理", zh: "ICT营业管理", en: "ICT Sales" },
    "common.nav_home": { ja: "ホーム", zh: "首页", en: "Home" },
    "common.nav_kansou": { ja: "感想掲示板", zh: "感想留言板", en: "Feedback" },
    "common.nav_shukkin": { ja: "出勤管理", zh: "出勤管理", en: "Attendance" },
    "common.nav_wiki": { ja: "WIKI", zh: "WIKI", en: "WIKI" },
    "common.nav_wiki_live": { ja: "知识库 Live", zh: "知识库 Live", en: "Wiki Live" },
    "common.nav_platform": { ja: "AI Platform", zh: "AI Platform", en: "AI Platform" },
    "common.nav_bingo": { ja: "ビンゴ", zh: "宾果", en: "Bingo" },
    "common.nav_wheel": { ja: "ルーレット", zh: "转盘", en: "Wheel" },
    "common.nav_portal": { ja: "ポータル", zh: "门户", en: "Portal" },
    "common.nav_github": { ja: "GitHub", zh: "GitHub", en: "GitHub" },
    "common.footer": { ja: "© 2026 Anonymoususers Portal", zh: "© 2026 Anonymoususers Portal", en: "© 2026 Anonymoususers Portal" },

    "index.title": { ja: "ラッキーポータル | ホーム", zh: "幸运门户 | 首页", en: "Lucky Portal | Home" },
    "index.card_kansou_t": { ja: "感想掲示板", zh: "感想留言板", en: "Feedback Board" },
    "index.card_kansou_d": { ja: "イベントやシステムへのご感想を投稿", zh: "发表对活动与系统的感想", en: "Share feedback on events and systems" },
    "index.card_shukkin_t": { ja: "出勤管理", zh: "出勤管理", en: "Attendance" },
    "index.card_shukkin_d": { ja: "出勤・退勤の打刻と勤怠記録の確認", zh: "打卡上下班并查看考勤记录", en: "Clock in/out and view attendance" },
    "index.card_ict_t": { ja: "ICT営業管理", zh: "ICT营业管理", en: "ICT Sales" },
    "index.card_ict_d": { ja: "請求CSV取込・経営Dashboard・部門評価", zh: "发票CSV导入·经营看板·部门评价", en: "Invoice CSV, dashboards, dept. ratings" },
    "index.card_wiki_t": { ja: "WIKI", zh: "WIKI", en: "WIKI" },
    "index.card_wiki_d": { ja: "YFC AI Knowledge Platform 設計書 V1.1", zh: "YFC AI 知识平台设计文档 V1.1", en: "YFC AI Knowledge Platform design V1.1" },
    "index.card_wikiapp_t": { ja: "知识库 Live", zh: "知识库 Live", en: "Wiki Live" },
    "index.card_wikiapp_d": { ja: "连接 Render Wiki API，浏览与发布知识帖", zh: "连接 Render Wiki API，浏览与发布知识帖", en: "Browse and publish posts via Render Wiki API" },
    "index.card_platform_t": { ja: "AI Platform", zh: "AI Platform", en: "AI Platform" },
    "index.card_platform_d": { ja: "Wiki API・積分サービス・RAG基盤（Render 部署）", zh: "Wiki API·积分服务·RAG 基础（Render 部署）", en: "Wiki API, points service, RAG (on Render)" },
    "index.card_bingo_t": { ja: "ビンゴ", zh: "宾果", en: "Bingo" },
    "index.card_bingo_d": { ja: "团建・パーティー向けビンゴ司会ページ", zh: "团建/派对宾果主持页面", en: "Bingo host for parties and team events" },
    "index.card_wheel_t": { ja: "ルーレット抽選", zh: "幸运转盘", en: "Lucky Wheel" },
    "index.card_wheel_d": { ja: "ラッキールーレットを回して賞品をゲット", zh: "转动幸运转盘赢取奖品", en: "Spin the wheel to win prizes" },

    "bingo.title": { ja: "ビンゴ司会 | Lucky Portal", zh: "宾果主持 | Lucky Portal", en: "Bingo Host | Lucky Portal" },
    "bingo.header_sub": { ja: "パーティービンゴ司会", zh: "派对宾果主持", en: "Party Bingo Host" },
    "bingo.lobby_h1": { ja: "ビンゴ", zh: "宾果", en: "Bingo" },
    "bingo.lobby_desc": { ja: "新しいゲームを開始するか、進行中のゲームを観戦できます。<br>同時に最大 10 ゲームまで実行できます。", zh: "可创建新游戏，或观战进行中的游戏。<br>最多同时进行 10 场游戏。", en: "Start a new game or watch one in progress.<br>Up to 10 games at once." },
    "bingo.lobby_new": { ja: "新しいゲームを開始", zh: "开始新游戏", en: "Start New Game" },
    "bingo.lobby_watch": { ja: "進行中のゲームを観戦", zh: "观战进行中的游戏", en: "Watch Live Games" },
    "bingo.lobby_limit": { ja: "進行中: 0 / 10", zh: "进行中: 0 / 10", en: "Active: 0 / 10" },
    "bingo.watch_h2": { ja: "進行中のゲーム一覧", zh: "进行中的游戏", en: "Active Games" },
    "bingo.watch_empty": { ja: "進行中のゲームはありません", zh: "暂无进行中的游戏", en: "No active games" },
    "bingo.spectator_badge": { ja: "観戦モード", zh: "观战模式", en: "Spectator" },
    "bingo.back_lobby": { ja: "ロビーに戻る", zh: "返回大厅", en: "Back to Lobby" },
    "bingo.status_ready": { ja: "準備完了", zh: "准备就绪", en: "Ready" },
    "bingo.spectator_note": { ja: "観戦モード — 操作できません。状態は自動更新されます。", zh: "观战模式 — 无法操作，状态自动更新。", en: "Spectator mode — view only; updates automatically." },
    "bingo.demo_countdown_label": { ja: "次の数字まで", zh: "距下一个数字", en: "Next number in" },
    "bingo.demo_drawing": { ja: "抽選中", zh: "抽选中", en: "Drawing" },
    "bingo.demo_new_game": { ja: "自分の新しいゲームを開始", zh: "开始我自己的新游戏", en: "Start My Own Game" },
    "bingo.remain_label": { ja: "残り", zh: "剩余", en: "Left" },
    "bingo.called_label": { ja: "出た数字", zh: "已出", en: "Called" },
    "bingo.draw_btn": { ja: "数字を引く", zh: "抽取数字", en: "Draw Number" },
    "bingo.reset_btn": { ja: "リセット", zh: "重置", en: "Reset" },
    "bingo.draw_hint": { ja: "Space キーでも抽選", zh: "也可按空格键抽号", en: "Space key also draws" },
    "bingo.card_btn": { ja: "デジタルカード", zh: "数字卡", en: "Digital Card" },
    "bingo.master_h2": { ja: "マスターボード — 出た数字は色付きで表示", zh: "主盘 — 已出数字高亮显示", en: "Master board — called numbers highlighted" },
    "bingo.card_modal_h2": { ja: "デジタルビンゴカード", zh: "数字宾果卡", en: "Digital Bingo Card" },
    "bingo.card_close": { ja: "閉じる", zh: "关闭", en: "Close" },
    "bingo.qr_label": { ja: "スキャンして観戦", zh: "扫码观战", en: "Scan to watch" },
    "bingo.qr_hint": { ja: "長押しでQRコードを保存", zh: "长按保存二维码", en: "Long-press to save QR" },
    "bingo.qr_saved": { ja: "QRコードを保存しました", zh: "二维码已保存", en: "QR code saved" },
    "bingo.resume_h2": { ja: "前回のゲームを続けますか？", zh: "继续上次的游戏？", en: "Continue previous game?" },
    "bingo.resume_desc": { ja: "この端末で進行中のゲームがあります。", zh: "本设备有进行中的游戏。", en: "A game is in progress on this device." },
    "bingo.resume_continue": { ja: "続ける", zh: "继续", en: "Continue" },
    "bingo.resume_abort": { ja: "ゲームを中止", zh: "中止游戏", en: "Abort Game" },
    "bingo.resume_lobby": { ja: "ロビーへ", zh: "回大厅", en: "To Lobby" },

    "kansou.title": { ja: "感想掲示板 | Users Portal", zh: "感想留言板 | Users Portal", en: "Feedback | Users Portal" },
    "kansou.h1": { ja: "感想掲示板", zh: "感想留言板", en: "Feedback Board" },
    "kansou.subtitle": { ja: "ご意見・ご感想をお気軽にお書きください", zh: "欢迎留下您的意见与感想", en: "Share your thoughts freely" },
    "kansou.form_title": { ja: "投稿フォーム", zh: "发帖", en: "Post Form" },
    "kansou.name_label": { ja: "お名前", zh: "姓名", en: "Name" },
    "kansou.name_ph": { ja: "例：山田 太郎", zh: "例：张三", en: "e.g. John Smith" },
    "kansou.body_label": { ja: "感想内容", zh: "感想内容", en: "Message" },
    "kansou.body_ph": { ja: "イベントやシステムへの感想をご記入ください", zh: "请填写对活动或系统的感想", en: "Your feedback on events or systems" },
    "kansou.submit": { ja: "投稿する", zh: "发布", en: "Submit" },
    "kansou.list_title": { ja: "感想リスト", zh: "留言列表", en: "Posts" },
    "kansou.list_count": { ja: "投稿数：0 件", zh: "帖子数：0", en: "Posts: 0" },
    "kansou.th_no": { ja: "No.", zh: "No.", en: "No." },
    "kansou.th_name": { ja: "お名前", zh: "姓名", en: "Name" },
    "kansou.th_date": { ja: "投稿日時", zh: "发布时间", en: "Posted" },
    "kansou.th_body": { ja: "感想内容", zh: "内容", en: "Message" },
    "kansou.th_actions": { ja: "操作", zh: "操作", en: "Actions" },
    "kansou.empty": { ja: "まだ投稿がありません。最初の感想を書いてみましょう。", zh: "暂无帖子，来写第一条吧。", en: "No posts yet. Be the first!" },
    "kansou.edit": { ja: "編集", zh: "编辑", en: "Edit" },
    "kansou.delete": { ja: "削除", zh: "删除", en: "Delete" },
    "kansou.save": { ja: "保存", zh: "保存", en: "Save" },
    "kansou.cancel": { ja: "取消", zh: "取消", en: "Cancel" },
    "kansou.flash_deleted": { ja: "投稿を削除しました。", zh: "帖子已删除。", en: "Post deleted." },
    "kansou.flash_empty_input": { ja: "お名前と感想内容を入力してください。", zh: "请填写姓名与感想内容。", en: "Please enter name and message." },
    "kansou.flash_updated": { ja: "投稿を更新しました。", zh: "帖子已更新。", en: "Post updated." },
    "kansou.flash_posted": { ja: "投稿しました。ありがとうございます！", zh: "发布成功，谢谢！", en: "Posted. Thank you!" },
    "kansou.confirm_delete": { ja: "「{name}」の投稿を削除しますか？\nこの操作は取り消せません。", zh: "确定删除「{name}」的帖子吗？\n此操作无法撤销。", en: "Delete post by 「{name}」?\nThis cannot be undone." },
    "kansou.list_count_tpl": { ja: "投稿数：{n} 件", zh: "帖子数：{n}", en: "Posts: {n}" },

    "shukkin.title": { ja: "出勤管理 | YFC Portal", zh: "出勤管理 | YFC Portal", en: "Attendance | YFC Portal" },
    "shukkin.h1": { ja: "出勤管理", zh: "出勤管理", en: "Attendance" },
    "shukkin.subtitle": { ja: "ログイン後、出勤・退勤打刻と勤怠修正申請が利用できます", zh: "登录后可进行上下班打卡与考勤修正申请", en: "After login: clock in/out and attendance correction requests" },
    "shukkin.auth_h2": { ja: "ログイン / 新規登録", zh: "登录 / 注册", en: "Login / Register" },
    "shukkin.tab_login": { ja: "ログイン", zh: "登录", en: "Login" },
    "shukkin.tab_register": { ja: "メールで新規登録", zh: "邮箱注册", en: "Register by Email" },

    "wheel.title": { ja: "ラッキールーレット", zh: "幸运转盘", en: "Lucky Wheel" },
    "wheel.h1": { ja: "ラッキールーレット", zh: "幸运转盘", en: "Lucky Wheel" },
    "wheel.subtitle": { ja: "ボタンを押して運試し（スペース連打でコンボ加速！）", zh: "点击按钮试试运气（连按空格加速连击！）", en: "Press to try your luck (mash Space for combo!)" },
    "wheel.prize_h2": { ja: "賞品一覧", zh: "奖品列表", en: "Prizes" },
    "wheel.th_color": { ja: "区分の色", zh: "颜色", en: "Color" },
    "wheel.th_amount": { ja: "賞金額", zh: "奖金", en: "Prize" },
    "wheel.th_count": { ja: "当選回数", zh: "中奖次数", en: "Wins" },
    "wheel.start": { ja: "抽選スタート", zh: "开始抽奖", en: "Spin" },
    "wheel.reset": { ja: "リセット", zh: "重置", en: "Reset" },

    "wiki_redirect.title": { ja: "YFC WIKI", zh: "YFC WIKI", en: "YFC WIKI" },
    "wiki_redirect.link": { ja: "YFC WIKI へ移動", zh: "前往 YFC WIKI", en: "Go to YFC WIKI" },
    "wiki_redirect.wait": { ja: "リダイレクト中…", zh: "正在跳转…", en: "Redirecting…" },

    "wikiapp.title": { ja: "知识库 | YFC AI Platform", zh: "知识库 | YFC AI Platform", en: "Wiki | YFC AI Platform" },
    "wikiapp.logo": { ja: "YFC 知识库", zh: "YFC 知识库", en: "YFC Wiki" },
    "wikiapp.nav_design": { ja: "设计 WIKI", zh: "设计 WIKI", en: "Design WIKI" },

    "platform.title": { ja: "YFC AI Knowledge Platform | 開発リポジトリ", zh: "YFC AI 知识平台 | 开发仓库", en: "YFC AI Platform | Dev Repo" },
    "platform.logo": { ja: "YFC AI Platform", zh: "YFC AI Platform", en: "YFC AI Platform" },
    "platform.nav_wiki_design": { ja: "設計 WIKI", zh: "设计 WIKI", en: "Design WIKI" },
    "platform.hero_badge": { ja: "Monorepo · V1.1", zh: "Monorepo · V1.1", en: "Monorepo · V1.1" },
    "platform.hero_h1": { ja: "YFC AI Knowledge Platform", zh: "YFC AI 知识平台", en: "YFC AI Knowledge Platform" },
    "platform.hero_p": { ja: "全社 AI 内製の共通基盤。社内 Wiki を Module 1 として実装し、積分サービス・RAG・MCP Gateway へ段階的に拡張する開発リポジトリです。", zh: "全公司 AI 自研共通基座。以社内 Wiki 为 Module 1，逐步扩展积分服务、RAG 与 MCP Gateway 的开发仓库。", en: "Company-wide AI platform monorepo. Module 1 is internal Wiki; points, RAG, and MCP Gateway follow." },
    "platform.section_packages": { ja: "パッケージ構成", zh: "包结构", en: "Packages" },
    "platform.section_links": { ja: "関連リンク", zh: "相关链接", en: "Related Links" },
    "platform.api_h2": { ja: "公网 API（Render）", zh: "公网 API（Render）", en: "Public API (Render)" },
    "platform.local_h2": { ja: "ローカル起動（開発者向け）", zh: "本地启动（开发者）", en: "Local dev" },

    "bingo.qr_save_fail": { ja: "QRコードを保存できませんでした", zh: "无法保存二维码", en: "Could not save QR code" },
    "bingo.qr_save_confirm": { ja: "観戦用QRコードを保存しますか？\n（画像ファイルとしてダウンロードされます）", zh: "是否保存观战二维码？\n（将下载为图片文件）", en: "Save spectator QR code?\n(Downloads as an image file)" },
    "bingo.watch_btn_count": { ja: "進行中のゲームを観戦 ({n})", zh: "观战进行中的游戏 ({n})", en: "Watch Live Games ({n})" },
    "bingo.lobby_limit_tpl": { ja: "進行中: {n} / {max}", zh: "进行中: {n} / {max}", en: "Active: {n} / {max}" },
    "bingo.new_game_limit_title": { ja: "同時に実行できるゲームは最大 10 件です", zh: "最多同时进行 10 场游戏", en: "Maximum 10 concurrent games" },
    "bingo.game_meta_demo": { ja: "デモ · 司会 {host} · 出た {called} 個 · 残り {pool} 個 · 24時間稼働", zh: "演示 · 主持 {host} · 已出 {called} · 剩余 {pool} · 24小时运行", en: "Demo · Host {host} · Called {called} · Left {pool} · 24/7" },
    "bingo.game_meta": { ja: "司会 {host} · 出た {called} 個 · 残り {pool} 個 · 残時間 約{min}分", zh: "主持 {host} · 已出 {called} · 剩余 {pool} · 约剩 {min} 分钟", en: "Host {host} · Called {called} · Left {pool} · ~{min} min left" },
    "bingo.end_game": { ja: "終了", zh: "结束", en: "End" },
    "bingo.continue_game": { ja: "続ける", zh: "继续", en: "Continue" },
    "bingo.watch_game": { ja: "観戦", zh: "观战", en: "Watch" },
    "bingo.confirm_end_game": { ja: "このゲームを終了しますか？\n観戦中の全員がロビーに戻されます。", zh: "确定结束此游戏吗？\n所有观战者将返回大厅。", en: "End this game?\nAll spectators return to the lobby." },
    "bingo.resume_meta": { ja: "出た {called} 個 · 残り {pool} 個", zh: "已出 {called} · 剩余 {pool}", en: "Called {called} · Left {pool}" },
    "bingo.resume_desc_host": { ja: "この端末（司会者）で進行中のゲームがあります。", zh: "本设备（主持）有进行中的游戏。", en: "A game is in progress on this device (host)." },
    "bingo.resume_desc_spectator": { ja: "前回観戦していたゲームがあります。", zh: "您上次观战的游戏仍在进行。", en: "You were watching a game last time." },
    "bingo.resume_continue_host": { ja: "ゲームを続ける", zh: "继续游戏", en: "Continue Game" },
    "bingo.resume_continue_spectator": { ja: "観戦を続ける", zh: "继续观战", en: "Continue Watching" },
    "bingo.resume_abort": { ja: "ゲームを中止", zh: "中止游戏", en: "Abort Game" },
    "bingo.resume_dismiss_host": { ja: "ロビーへ（ゲームは継続）", zh: "回大厅（游戏继续）", en: "Lobby (game continues)" },
    "bingo.resume_dismiss_spectator": { ja: "ロビーへ", zh: "回大厅", en: "To Lobby" },
    "bingo.notice_game_ended": { ja: "ゲームを終了しました。", zh: "游戏已结束。", en: "Game ended." },
    "bingo.notice_game_aborted": { ja: "ゲームを中止しました。", zh: "游戏已中止。", en: "Game aborted." },
    "bingo.notice_host_aborted": { ja: "司会者がゲームを中止しました。観戦するゲームを選び直してください。", zh: "主持已中止游戏，请重新选择观战。", en: "Host aborted the game. Pick another to watch." },
    "bingo.alert_game_not_found": { ja: "ゲームが見つかりません。", zh: "找不到游戏。", en: "Game not found." },
    "bingo.alert_game_finished": { ja: "このゲームは既に終了しています。", zh: "此游戏已结束。", en: "This game has already ended." },
    "bingo.alert_other_host": { ja: "このゲームの司会者は別の端末です。観戦モードで入ってください。", zh: "此游戏主持在另一台设备，请以观战模式进入。", en: "Host is on another device. Enter as spectator." },
    "bingo.spectator_status": { ja: "観戦中 — 残り {n} 個の数字", zh: "观战中 — 剩余 {n} 个数字", en: "Watching — {n} numbers left" },
    "bingo.alert_max_games": { ja: "同時に実行できるゲームは最大 {max} 件です。\n進行中のゲームを終了するか、観戦のみ可能です。", zh: "最多同时进行 {max} 场游戏。\n请结束进行中的游戏或仅观战。", en: "Maximum {max} concurrent games.\nEnd one or watch only." },
    "bingo.game_finished_all": { ja: "ゲーム終了 — 全ての数字が出ました", zh: "游戏结束 — 所有数字已出", en: "Game over — all numbers called" },
    "bingo.spectator_drawing": { ja: "観戦中 — 数字を抽選中…", zh: "观战中 — 正在抽号…", en: "Watching — drawing…" },
    "bingo.notice_timeout": { ja: "このゲームは5時間の上限に達したため自動終了しました。", zh: "游戏已达 5 小时上限，自动结束。", en: "Game auto-ended after 5-hour limit." },
    "bingo.notice_host_ended": { ja: "司会者がゲームを終了しました。", zh: "主持已结束游戏。", en: "Host ended the game." },
    "bingo.confirm_abort": { ja: "このゲームを中止しますか？\n観戦中の全員がロビーに戻されます。", zh: "确定中止此游戏吗？\n所有观战者将返回大厅。", en: "Abort this game?\nAll spectators return to the lobby." },
    "bingo.confirm_reset": { ja: "このゲームをリセットしますか？", zh: "确定重置此游戏吗？", en: "Reset this game?" },
    "bingo.confirm_leave_drawing": { ja: "抽選中です。ロビーに戻りますか？", zh: "正在抽号，确定返回大厅吗？", en: "Drawing in progress. Return to lobby?" },
    "bingo.status_remain": { ja: "残り {n} 個の数字", zh: "剩余 {n} 个数字", en: "{n} numbers left" },
    "bingo.status_all_called": { ja: "全ての数字が出しました", zh: "所有数字已出", en: "All numbers called" },
    "bingo.game_bar_meta": { ja: "出た {called} / 残り {pool}", zh: "已出 {called} / 剩余 {pool}", en: "Called {called} / Left {pool}" },
    "bingo.status_bingo": { ja: "全ての数字が出ました — ビンゴ！{combo}", zh: "所有数字已出 — 宾果！{combo}", en: "All called — BINGO!{combo}" },
    "bingo.status_combo": { ja: "残り {n} 個の数字 — {combo} COMBO!", zh: "剩余 {n} 个数字 — {combo} 连击!", en: "{n} left — {combo} COMBO!" },
    "bingo.demo_sec": { ja: "{n}秒", zh: "{n}秒", en: "{n}s" },

    "wheel.color_red": { ja: "赤", zh: "红", en: "Red" },
    "wheel.color_yellow": { ja: "黄", zh: "黄", en: "Yellow" },
    "wheel.color_blue": { ja: "青", zh: "蓝", en: "Blue" },
    "wheel.color_green": { ja: "緑", zh: "绿", en: "Green" },
    "wheel.prize_yen": { ja: "{n}円", zh: "{n}元", en: "¥{n}" },
    "wheel.win_msg": { ja: "おめでとうございます！{prize}（{color}）を獲得しました 🎉{combo}", zh: "恭喜！获得 {prize}（{color}）🎉{combo}", en: "You won {prize} ({color})! 🎉{combo}" },
    "wheel.combo_note": { ja: "（{n} COMBO!）", zh: "（{n} 连击!）", en: " ({n} COMBO!)" },

    "wikiapp.hero_h1": { ja: "知识库（Live API）", zh: "知识库（Live API）", en: "Wiki (Live API)" },
    "wikiapp.hero_p": { ja: "通过门户直接连接 Render 上的 Wiki Module API，浏览与创建知识帖。", zh: "通过门户直接连接 Render 上的 Wiki Module API，浏览与创建知识帖。", en: "Connect to Render Wiki Module API from the portal to browse and create posts." },
    "wikiapp.refresh": { ja: "刷新", zh: "刷新", en: "Refresh" },
    "wikiapp.posts_h2": { ja: "最新帖子", zh: "最新帖子", en: "Latest Posts" },
    "wikiapp.create_h2": { ja: "创建帖子", zh: "创建帖子", en: "Create Post" },
    "wikiapp.label_title": { ja: "标题", zh: "标题", en: "Title" },
    "wikiapp.ph_title": { ja: "例：COBOL 迁移注意事项", zh: "例：COBOL 迁移注意事项", en: "e.g. COBOL migration notes" },
    "wikiapp.label_category": { ja: "分类代码", zh: "分类代码", en: "Category" },
    "wikiapp.label_type": { ja: "类型", zh: "类型", en: "Type" },
    "wikiapp.label_conf": { ja: "机密级别", zh: "机密级别", en: "Confidentiality" },
    "wikiapp.label_summary": { ja: "摘要（可留空，AI 自动补全）", zh: "摘要（可留空，AI 自动补全）", en: "Summary (optional, AI may fill)" },
    "wikiapp.label_body": { ja: "正文（Markdown）", zh: "正文（Markdown）", en: "Body (Markdown)" },
    "wikiapp.ph_body": { ja: "# 正文内容", zh: "# 正文内容", en: "# Content" },
    "wikiapp.submit": { ja: "发布到 Render API", zh: "发布到 Render API", en: "Publish to Render API" },
    "wikiapp.status_checking": { ja: "检测中…", zh: "检测中…", en: "Checking…" },
    "wikiapp.status_no_api": { ja: "未配置 API", zh: "未配置 API", en: "API not configured" },
    "wikiapp.status_no_api_detail": { ja: "请编辑 portal-config.js 中的 wikiApiUrl", zh: "请编辑 portal-config.js 中的 wikiApiUrl", en: "Set wikiApiUrl in portal-config.js" },
    "wikiapp.status_bad_url": { ja: "API 地址有误", zh: "API 地址有误", en: "Invalid API URL" },
    "wikiapp.status_bad_url_detail": { ja: "wikiApiUrl 不能是 /wiki/ 文档站，需指向 Node Web Service 根地址", zh: "wikiApiUrl 不能是 /wiki/ 文档站，需指向 Node Web Service 根地址", en: "wikiApiUrl must point to the Node service root, not /wiki/ docs" },
    "wikiapp.status_ok": { ja: "API 已连接", zh: "API 已连接", en: "API connected" },
    "wikiapp.status_err": { ja: "API 不可用", zh: "API 不可用", en: "API unavailable" },
    "wikiapp.status_err_suffix": { ja: " — 请在 Render 创建 yfc-wiki-api Web Service；冷启动约 30–60 秒", zh: " — 请在 Render 创建 yfc-wiki-api Web Service；冷启动约 30–60 秒", en: " — Create yfc-wiki-api on Render; cold start ~30–60s" },
    "wikiapp.balance": { ja: "积分余额：{n}", zh: "积分余额：{n}", en: "Points: {n}" },
    "wikiapp.balance_na": { ja: "积分余额：—", zh: "积分余额：—", en: "Points: —" },
    "wikiapp.posts_empty": { ja: "暂无帖子，请在下方创建第一条知识帖。", zh: "暂无帖子，请在下方创建第一条知识帖。", en: "No posts yet. Create the first one below." },
    "wikiapp.posts_loading": { ja: "加载中…", zh: "加载中…", en: "Loading…" },
    "wikiapp.no_summary": { ja: "（无摘要）", zh: "（无摘要）", en: "(no summary)" },
    "wikiapp.create_fail": { ja: "创建失败：{msg}", zh: "创建失败：{msg}", en: "Create failed: {msg}" },

    "shukkin.login_id_label": { ja: "ユーザー名 または メール", zh: "用户名或邮箱", en: "Username or email" },
    "shukkin.login_id_ph": { ja: "root001 または user@example.com", zh: "root001 或 user@example.com", en: "root001 or user@example.com" },
    "shukkin.password_label": { ja: "パスワード", zh: "密码", en: "Password" },
    "shukkin.login_submit": { ja: "ログイン", zh: "登录", en: "Log in" },
    "shukkin.login_hint": { ja: "初期管理者：root001 / 001root", zh: "初始管理员：root001 / 001root", en: "Default admin: root001 / 001root" },
    "shukkin.reg_username": { ja: "ユーザー名", zh: "用户名", en: "Username" },
    "shukkin.reg_email": { ja: "メールアドレス", zh: "邮箱", en: "Email" },
    "shukkin.reg_display": { ja: "表示名（お名前）", zh: "显示名", en: "Display name" },
    "shukkin.reg_password": { ja: "パスワード", zh: "密码", en: "Password" },
    "shukkin.reg_password2": { ja: "パスワード（確認）", zh: "确认密码", en: "Confirm password" },
    "shukkin.reg_submit": { ja: "ユーザー登録", zh: "注册", en: "Register" },
    "shukkin.reg_hint": { ja: "一般ユーザーとして登録されます。管理者の追加は管理者のみ可能です。", zh: "注册为普通用户。仅管理员可添加管理员。", en: "Registered as a regular user. Only admins can add admins." },
    "shukkin.punch_h2": { ja: "打刻", zh: "打卡", en: "Clock" },
    "shukkin.logged_in": { ja: "ログイン中：", zh: "已登录：", en: "Signed in: " },
    "shukkin.status_label": { ja: "本日のステータス", zh: "今日状态", en: "Today's status" },
    "shukkin.status_idle": { ja: "未出勤", zh: "未出勤", en: "Not clocked in" },
    "shukkin.status_working": { ja: "勤務中", zh: "工作中", en: "Working" },
    "shukkin.status_done": { ja: "退勤済み", zh: "已退勤", en: "Clocked out" },
    "shukkin.today_tpl": { ja: "本日（{date}）", zh: "今日（{date}）", en: "Today ({date})" },
    "shukkin.punch_in": { ja: "出勤", zh: "上班", en: "Clock in" },
    "shukkin.punch_out": { ja: "退勤", zh: "下班", en: "Clock out" },
    "shukkin.my_records_h2": { ja: "自分の勤怠記録", zh: "我的考勤记录", en: "My records" },
    "shukkin.my_records_count": { ja: "記録数：{n} 件", zh: "记录数：{n}", en: "Records: {n}" },
    "shukkin.my_records_empty": { ja: "まだ勤怠記録がありません。", zh: "暂无考勤记录。", en: "No attendance records yet." },
    "shukkin.th_date": { ja: "日付", zh: "日期", en: "Date" },
    "shukkin.th_times": { ja: "出勤→退勤", zh: "上班→下班", en: "In→Out" },
    "shukkin.th_duration": { ja: "勤務時間", zh: "工时", en: "Duration" },
    "shukkin.th_actions": { ja: "操作", zh: "操作", en: "Actions" },
    "shukkin.request_edit": { ja: "修正申請", zh: "修正申请", en: "Request edit" },
    "shukkin.request_h2": { ja: "勤怠修正申請", zh: "考勤修正申请", en: "Correction request" },
    "shukkin.req_record": { ja: "対象記録", zh: "目标记录", en: "Record" },
    "shukkin.req_clock_in": { ja: "変更後 出勤 (HH:MM)", zh: "修改后上班 (HH:MM)", en: "New clock-in (HH:MM)" },
    "shukkin.req_clock_out": { ja: "変更後 退勤 (HH:MM)", zh: "修改后下班 (HH:MM)", en: "New clock-out (HH:MM)" },
    "shukkin.req_reason": { ja: "修正理由", zh: "修正理由", en: "Reason" },
    "shukkin.req_reason_ph": { ja: "打刻忘れ、早退、残業など", zh: "忘打卡、早退、加班等", en: "Forgot punch, early leave, overtime, etc." },
    "shukkin.req_submit": { ja: "修正申請を送信", zh: "提交修正申请", en: "Submit request" },
    "shukkin.my_requests_count": { ja: "申請数：{n} 件", zh: "申请数：{n}", en: "Requests: {n}" },
    "shukkin.my_requests_empty": { ja: "修正申請はありません。", zh: "暂无修正申请。", en: "No correction requests." },
    "shukkin.admin_approve_h2": { ja: "修正申請の承認", zh: "审批修正申请", en: "Approve requests" },
    "shukkin.admin_pending_count": { ja: "未処理：{n} 件", zh: "待处理：{n}", en: "Pending: {n}" },
    "shukkin.admin_all_h2": { ja: "全ユーザーの勤怠記録（直接修正）", zh: "全员考勤记录（直接修改）", en: "All users' records (direct edit)" },
    "shukkin.admin_all_count": { ja: "全記録：{n} 件", zh: "全部记录：{n}", en: "All records: {n}" },
    "shukkin.admin_users_h2": { ja: "ユーザー管理", zh: "用户管理", en: "User management" },
    "shukkin.add_email": { ja: "メール", zh: "邮箱", en: "Email" },
    "shukkin.add_display": { ja: "表示名", zh: "显示名", en: "Display name" },
    "shukkin.add_role": { ja: "権限", zh: "权限", en: "Role" },
    "shukkin.role_user": { ja: "ユーザー", zh: "用户", en: "User" },
    "shukkin.role_admin": { ja: "管理者", zh: "管理员", en: "Admin" },
    "shukkin.add_password": { ja: "初期パスワード", zh: "初始密码", en: "Initial password" },
    "shukkin.add_submit": { ja: "ユーザーを追加", zh: "添加用户", en: "Add user" },
    "shukkin.add_hint": { ja: "管理者のみ、一般ユーザー・管理者を追加できます。", zh: "仅管理员可添加普通用户或管理员。", en: "Only admins can add users or admins." },
    "shukkin.logout": { ja: "ログアウト", zh: "退出登录", en: "Log out" },
    "shukkin.unknown": { ja: "不明", zh: "未知", en: "Unknown" },
    "shukkin.times_in_out": { ja: "出勤 {in} ／ 退勤 {out}", zh: "上班 {in} ／ 下班 {out}", en: "In {in} / Out {out}" },
    "shukkin.work_duration": { ja: "勤務時間 {d}", zh: "工时 {d}", en: "Duration {d}" },
    "shukkin.duration_hm": { ja: "{h}時間{m}分", zh: "{h}小时{m}分", en: "{h}h {m}m" },
    "shukkin.duration_m": { ja: "{m}分", zh: "{m}分", en: "{m} min" },
    "shukkin.status_pending": { ja: "審査中", zh: "审核中", en: "Pending" },
    "shukkin.status_approved": { ja: "承認", zh: "已批准", en: "Approved" },
    "shukkin.status_rejected": { ja: "却下", zh: "已拒绝", en: "Rejected" },
    "shukkin.flash_logout": { ja: "ログアウトしました。", zh: "已退出登录。", en: "Logged out." },
    "shukkin.flash_already_in": { ja: "本日はすでに出勤打刻済みです。", zh: "今日已打过上班卡。", en: "Already clocked in today." },
    "shukkin.flash_punch_in": { ja: "出勤を記録しました（{time}）", zh: "已记录上班（{time}）", en: "Clock-in recorded ({time})" },
    "shukkin.flash_no_in": { ja: "本日の出勤打刻がありません。", zh: "今日尚未打上班卡。", en: "No clock-in today." },
    "shukkin.flash_already_out": { ja: "本日はすでに退勤打刻済みです。", zh: "今日已打过下班卡。", en: "Already clocked out today." },
    "shukkin.flash_punch_out": { ja: "退勤を記録しました（{time}）", zh: "已记录下班（{time}）", en: "Clock-out recorded ({time})" },
    "shukkin.flash_record_missing": { ja: "対象の勤怠記録が見つかりません。", zh: "找不到目标考勤记录。", en: "Record not found." },
    "shukkin.flash_req_fields": { ja: "変更後の時刻と理由を入力してください。", zh: "请填写修改后的时间与理由。", en: "Enter new times and reason." },
    "shukkin.flash_bad_time": { ja: "時刻の形式が正しくありません。", zh: "时间格式不正确。", en: "Invalid time format." },
    "shukkin.flash_out_before_in": { ja: "退勤時刻は出勤時刻より後にしてください。", zh: "下班时间须晚于上班时间。", en: "Clock-out must be after clock-in." },
    "shukkin.flash_pending_exists": { ja: "この記録には未処理の申請があります。", zh: "该记录已有待处理申请。", en: "Pending request exists for this record." },
    "shukkin.flash_req_sent": { ja: "修正申請を送信しました。", zh: "修正申请已提交。", en: "Request submitted." },
    "shukkin.flash_req_approved": { ja: "修正申請を承認しました。", zh: "修正申请已批准。", en: "Request approved." },
    "shukkin.flash_req_rejected": { ja: "修正申請を却下しました。", zh: "修正申请已拒绝。", en: "Request rejected." },
    "shukkin.flash_record_updated": { ja: "勤怠記録を更新しました。", zh: "考勤记录已更新。", en: "Record updated." },
    "shukkin.flash_login_fields": { ja: "ユーザー名/メールとパスワードを入力してください。", zh: "请填写用户名/邮箱与密码。", en: "Enter username/email and password." },
    "shukkin.flash_user_not_found": { ja: "ユーザーが見つかりません。", zh: "用户不存在。", en: "User not found." },
    "shukkin.flash_bad_password": { ja: "パスワードが正しくありません。", zh: "密码不正确。", en: "Incorrect password." },
    "shukkin.flash_logged_in": { ja: "ログインしました。", zh: "登录成功。", en: "Logged in." },
    "shukkin.flash_all_fields": { ja: "すべての項目を入力してください。", zh: "请填写所有字段。", en: "Fill in all fields." },
    "shukkin.flash_bad_email": { ja: "有効なメールアドレスを入力してください。", zh: "请输入有效邮箱。", en: "Enter a valid email." },
    "shukkin.flash_short_password": { ja: "パスワードは6文字以上にしてください。", zh: "密码至少 6 位。", en: "Password must be at least 6 characters." },
    "shukkin.flash_password_mismatch": { ja: "パスワード確認が一致しません。", zh: "两次密码不一致。", en: "Passwords do not match." },
    "shukkin.flash_username_taken": { ja: "このユーザー名は既に使用されています。", zh: "用户名已被占用。", en: "Username already taken." },
    "shukkin.flash_email_taken": { ja: "このメールアドレスは既に登録されています。", zh: "邮箱已注册。", en: "Email already registered." },
    "shukkin.flash_registered": { ja: "登録が完了しました。ログインしてください。", zh: "注册完成，请登录。", en: "Registered. Please log in." },
    "shukkin.flash_admin_only": { ja: "管理者のみユーザー追加できます。", zh: "仅管理员可添加用户。", en: "Only admins can add users." },
    "shukkin.flash_bad_role": { ja: "権限が不正です。", zh: "权限无效。", en: "Invalid role." },
    "shukkin.flash_user_added": { ja: "ユーザーを追加しました。", zh: "用户已添加。", en: "User added." },
    "shukkin.review_approved": { ja: "承認されました", zh: "已批准", en: "Approved" },
    "shukkin.review_rejected_default": { ja: "却下されました", zh: "已拒绝", en: "Rejected" },
    "shukkin.prompt_reject": { ja: "却下理由（任意）:", zh: "拒绝理由（可选）:", en: "Rejection reason (optional):" },
    "shukkin.prompt_clock_in": { ja: "出勤時刻 (HH:MM):", zh: "上班时间 (HH:MM):", en: "Clock-in (HH:MM):" },
    "shukkin.prompt_clock_out": { ja: "退勤時刻 (HH:MM):", zh: "下班时间 (HH:MM):", en: "Clock-out (HH:MM):" },
    "shukkin.btn_approve": { ja: "承認", zh: "批准", en: "Approve" },
    "shukkin.btn_reject": { ja: "却下", zh: "拒绝", en: "Reject" },
    "shukkin.btn_edit_direct": { ja: "直接修正", zh: "直接修改", en: "Edit directly" },
    "shukkin.admin_records_empty": { ja: "勤怠記録がありません。", zh: "暂无考勤记录。", en: "No attendance records." },
    "shukkin.admin_pending_empty": { ja: "未処理の修正申請はありません。", zh: "暂无待处理申请。", en: "No pending requests." },
    "shukkin.th_user": { ja: "ユーザー", zh: "用户", en: "User" },
    "shukkin.th_username": { ja: "ユーザー名", zh: "用户名", en: "Username" },
    "shukkin.th_email": { ja: "メール", zh: "邮箱", en: "Email" },
    "shukkin.request_title_tpl": { ja: "{date} の勤怠修正", zh: "{date} 考勤修正", en: "Correction for {date}" },
    "shukkin.request_applied": { ja: "申請：", zh: "申请：", en: "Submitted: " },
    "shukkin.request_changed": { ja: "変更後：", zh: "修改后：", en: "Requested: " },
    "shukkin.request_reason": { ja: "理由：", zh: "理由：", en: "Reason: " },
    "shukkin.admin_comment": { ja: "管理者コメント：", zh: "管理员备注：", en: "Admin note: " },
    "shukkin.current_times": { ja: "現在：", zh: "当前：", en: "Current: " },
    "shukkin.request_times": { ja: "申請：", zh: "申请：", en: "Request: " },
    "shukkin.footer": { ja: "© 2026 YFC Portal", zh: "© 2026 YFC Portal", en: "© 2026 YFC Portal" },
  };

  function getLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.includes(saved)) return saved;
    } catch (_) { /* ignore */ }
    return DEFAULT_LANG;
  }

  function wikiPathForLang(lang, pathname) {
    let path = pathname || location.pathname;
    path = path.replace(/\\/g, "/");
    const wikiIdx = path.indexOf("/wiki");
    if (wikiIdx < 0) return null;
    let sub = path.slice(wikiIdx + 5);
    if (sub.startsWith("/zh-Hans")) sub = sub.slice("/zh-Hans".length);
    else if (sub.startsWith("/en")) sub = sub.slice("/en".length);
    if (!sub.startsWith("/")) sub = "/" + sub;
    if (lang === "zh") return path.slice(0, wikiIdx) + "/wiki/zh-Hans" + sub;
    if (lang === "en") return path.slice(0, wikiIdx) + "/wiki/en" + sub;
    return path.slice(0, wikiIdx) + "/wiki" + sub;
  }

  function isWikiPage() {
    return location.pathname.replace(/\\/g, "/").includes("/wiki");
  }

  function setLang(lang, options) {
    if (!LANGS.includes(lang)) return;
    const opts = options || {};
    if (!opts.skipWikiRedirect && isWikiPage()) {
      const target = wikiPathForLang(lang, location.pathname);
      if (target && target !== location.pathname) {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* ignore */ }
        location.assign(target + location.search + location.hash);
        return;
      }
    }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* ignore */ }
    applyI18n();
    document.dispatchEvent(new CustomEvent("portal-lang-change", { detail: { lang } }));
  }

  function t(key, vars) {
    const lang = getLang();
    const entry = M[key];
    let text = entry ? (entry[lang] || entry.ja || key) : key;
    if (vars && typeof vars === "object") {
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return text;
  }

  function wikiHref(lang) {
    const base = lang === "zh" ? "wiki/zh-Hans/" : lang === "en" ? "wiki/en/" : "wiki/";
    return resolveAsset(base);
  }

  function resolveAsset(path) {
    const script = document.currentScript;
    if (script && script.src) {
      const u = new URL(script.src, location.href);
      return new URL(path, u).pathname;
    }
    const depth = (location.pathname.match(/\//g) || []).length - 1;
    const prefix = depth > 1 ? "../".repeat(depth - 1) : depth === 1 ? "../" : "";
    return prefix + path;
  }

  function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = t(key);
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.placeholder = t(key);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.title = t(key);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });

    const titleMeta = document.querySelector('meta[name="portal-i18n-title"]');
    if (titleMeta) document.title = t(titleMeta.getAttribute("content"));

    document.querySelectorAll("[data-i18n-wiki-link]").forEach((el) => {
      el.setAttribute("href", wikiHref(lang));
    });

    document.querySelectorAll(".portal-lang-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });
  }

  function injectLangSwitcher(mount) {
    if (!mount || mount.querySelector(".portal-lang-switcher")) return;
    const wrap = document.createElement("div");
    wrap.className = "portal-lang-switcher";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language");
    LANGS.forEach((lang) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "portal-lang-btn";
      btn.setAttribute("data-lang", lang);
      btn.textContent = lang === "ja" ? "日" : lang === "zh" ? "中" : "EN";
      btn.addEventListener("click", () => setLang(lang));
      wrap.appendChild(btn);
    });
    mount.appendChild(wrap);
  }

  function initLangSwitcher() {
    const headerMount = document.querySelector("[data-lang-switcher]");
    if (headerMount) {
      injectLangSwitcher(headerMount);
      return;
    }
    const header = document.querySelector(".site-header");
    if (header) {
      injectLangSwitcher(header);
      return;
    }
    let fixed = document.querySelector(".portal-lang-switcher--fixed");
    if (!fixed) {
      fixed = document.createElement("div");
      fixed.className = "portal-lang-switcher portal-lang-switcher--fixed";
      fixed.setAttribute("data-lang-switcher", "");
      document.body.appendChild(fixed);
    }
    injectLangSwitcher(fixed);
  }

  function init() {
    initLangSwitcher();
    applyI18n();
  }

  window.YFC_I18N = {
    getLang,
    setLang,
    t,
    apply: applyI18n,
    wikiHref,
    LANGS,
    messages: M,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
