/**
 * Bingo4All i18n — 日本語 / 中文 / English
 */
(function () {
  const STORAGE_KEY = "bingo4all_lang";
  const DEFAULT_LANG = "ja";
  const LANGS = ["ja", "zh", "en"];

  const M = {
    "common.logo": { ja: "Bingo4All", zh: "Bingo4All", en: "Bingo4All" },
    "bingo.title": { ja: "ビンゴ司会 | Bingo4All", zh: "宾果主持 | Bingo4All", en: "Bingo Host | Bingo4All" },
    "bingo.header_sub": { ja: "パーティービンゴ司会", zh: "派对宾果主持", en: "Party Bingo Host" },
    "bingo.lobby_h1": { ja: "ビンゴ", zh: "宾果", en: "Bingo" },
    "bingo.lobby_desc": { ja: "新しいゲームを開始するか、進行中のゲームを観戦できます。<br>同時に最大 20 ゲームまで実行できます。", zh: "可创建新游戏，或观战进行中的游戏。<br>最多同时进行 20 场游戏。", en: "Start a new game or watch one in progress.<br>Up to 20 games at once." },
    "bingo.lobby_new": { ja: "新しいゲームを開始", zh: "开始新游戏", en: "Start New Game" },
    "bingo.lobby_watch": { ja: "進行中のゲームを観戦", zh: "观战进行中的游戏", en: "Watch Live Games" },
    "bingo.lobby_limit": { ja: "進行中: 0 / 20", zh: "进行中: 0 / 20", en: "Active: 0 / 20" },
    "bingo.watch_h2": { ja: "進行中のゲーム一覧", zh: "进行中的游戏", en: "Active Games" },
    "bingo.watch_empty": { ja: "進行中のゲームはありません", zh: "暂无进行中的游戏", en: "No active games" },
    "bingo.spectator_badge": { ja: "観戦モード", zh: "观战模式", en: "Spectator" },
    "bingo.back_lobby": { ja: "ロビーに戻る", zh: "返回大厅", en: "Back to Lobby" },
    "bingo.exit_game": { ja: "このゲームを終了", zh: "退出当前游戏", en: "Leave Game" },
    "bingo.end_current_game": { ja: "このゲームを終了", zh: "结束当前游戏", en: "End Game" },
    "bingo.confirm_exit_game": { ja: "このゲームから退出しますか？\nゲーム自体は続行されます。", zh: "确定退出当前游戏吗？\n游戏本身会继续进行。", en: "Leave this game?\nThe game will continue for others." },
    "bingo.alert_end_game_fail": { ja: "ゲームを終了できませんでした", zh: "无法结束游戏", en: "Could not end the game" },
    "bingo.status_ready": { ja: "準備完了", zh: "准备就绪", en: "Ready" },
    "bingo.spectator_note": { ja: "観戦モード — 操作できません。状態は自動更新されます。", zh: "观战模式 — 无法操作，状态自动更新。", en: "Spectator mode — view only; updates automatically." },
    "bingo.demo_countdown_label": { ja: "次の数字まで", zh: "距下一个数字", en: "Next number in" },
    "bingo.demo_drawing": { ja: "抽選中", zh: "抽选中", en: "Drawing" },
    "bingo.demo_new_game": { ja: "自分の新しいゲームを開始", zh: "开始我自己的新游戏", en: "Start My Own Game" },
    "bingo.remain_label": { ja: "残り", zh: "剩余", en: "Left" },
    "bingo.called_label": { ja: "出た数字", zh: "已出", en: "Called" },
    "bingo.participants_label": { ja: "参加人数", zh: "参加人数", en: "Players" },
    "bingo.game_list_col_game": { ja: "ゲーム", zh: "游戏", en: "Game" },
    "bingo.game_list_col_players": { ja: "参加人数", zh: "参加人数", en: "Players" },
    "bingo.game_list_col_action": { ja: "操作", zh: "操作", en: "Action" },
    "bingo.draw_btn": { ja: "数字を引く", zh: "抽取数字", en: "Draw Number" },
    "bingo.reset_btn": { ja: "リセット", zh: "重置", en: "Reset" },
    "bingo.draw_hint": { ja: "Space キー・大きな球クリックでも抽選", zh: "也可按空格键或点击大球抽号", en: "Space key or click the big ball to draw" },
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
    "bingo.qr_save_fail": { ja: "QRコードを保存できませんでした", zh: "无法保存二维码", en: "Could not save QR code" },
    "bingo.qr_save_confirm": { ja: "観戦用QRコードを保存しますか？\n（画像ファイルとしてダウンロードされます）", zh: "是否保存观战二维码？\n（将下载为图片文件）", en: "Save spectator QR code?\n(Downloads as an image file)" },
    "bingo.watch_btn_count": { ja: "進行中のゲームを観戦 ({n})", zh: "观战进行中的游戏 ({n})", en: "Watch Live Games ({n})" },
    "bingo.lobby_limit_tpl": { ja: "進行中: {n} / {max}", zh: "进行中: {n} / {max}", en: "Active: {n} / {max}" },
    "bingo.new_game_limit_title": { ja: "同時に実行できるゲームは最大 20 件です", zh: "最多同时进行 20 场游戏", en: "Maximum 20 concurrent games" },
    "bingo.game_meta_demo": { ja: "デモ · 司会 {host} · 出た {called} 個 · 残り {pool} 個 · 24時間稼働", zh: "演示 · 主持 {host} · 已出 {called} · 剩余 {pool} · 24小时运行", en: "Demo · Host {host} · Called {called} · Left {pool} · 24/7" },
    "bingo.game_meta": { ja: "司会 {host} · 出た {called} 個 · 残り {pool} 個 · 無操作約{min}分で終了", zh: "主持 {host} · 已出 {called} · 剩余 {pool} · 无操作约 {min} 分钟后结束", en: "Host {host} · Called {called} · Left {pool} · ends in ~{min} min if idle" },
    "bingo.game_meta_warning": { ja: "司会 {host} · 出た {called} 個 · 残り {pool} 個 · {sec}秒後に終了", zh: "主持 {host} · 已出 {called} · 剩余 {pool} · {sec} 秒后结束", en: "Host {host} · Called {called} · Left {pool} · ends in {sec}s" },
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
    "bingo.alert_ip_game_limit": { ja: "他の方もゲームを楽しめるよう、同時に作成できるゲームは最大 {max} 件までです。既存のゲームを終了してから、もう一度お試しください。", zh: "为了让其他人也能进行游戏，你只能同时最多创建 {max} 局游戏。请关闭现有游戏后再重新创建。", en: "To let others play too, you can create at most {max} games at a time. Please close an existing game before creating a new one." },
    "bingo.game_finished_all": { ja: "ゲーム終了 — 全ての数字が出ました", zh: "游戏结束 — 所有数字已出", en: "Game over — all numbers called" },
    "bingo.spectator_drawing": { ja: "観戦中 — 数字を抽選中…", zh: "观战中 — 正在抽号…", en: "Watching — drawing…" },
    "bingo.notice_timeout": { ja: "このゲームは5時間の上限に達したため自動終了しました。", zh: "游戏已达 5 小时上限，自动结束。", en: "Game auto-ended after 5-hour limit." },
    "bingo.notice_host_ended": { ja: "司会者がゲームを終了しました。", zh: "主持已结束游戏。", en: "Host ended the game." },
    "bingo.confirm_abort": { ja: "このゲームを中止しますか？\n観戦中の全員がロビーに戻されます。", zh: "确定中止此游戏吗？\n所有观战者将返回大厅。", en: "Abort this game?\nAll spectators return to the lobby." },
    "bingo.confirm_reset": { ja: "このゲームをリセットしますか？", zh: "确定重置此游戏吗？", en: "Reset this game?" },
    "bingo.confirm_leave_drawing": { ja: "抽選中です。ロビーに戻りますか？", zh: "正在抽号，确定返回大厅吗？", en: "Drawing in progress. Return to lobby?" },
    "bingo.status_remain": { ja: "残り {n} 個の数字", zh: "剩余 {n} 个数字", en: "{n} numbers left" },
    "bingo.status_all_called": { ja: "全ての数字が出しました", zh: "所有数字已出", en: "All numbers called" },
    "bingo.game_bar_meta": { ja: "出た {called} / 残り {pool} / 参加 {n}", zh: "已出 {called} / 剩余 {pool} / 参加 {n}", en: "Called {called} / Left {pool} / Players {n}" },
    "bingo.status_bingo": { ja: "全ての数字が出ました — ビンゴ！{combo}", zh: "所有数字已出 — 宾果！{combo}", en: "All called — BINGO!{combo}" },
    "bingo.status_combo": { ja: "残り {n} 個の数字 — {combo} COMBO!", zh: "剩余 {n} 个数字 — {combo} 连击!", en: "{n} left — {combo} COMBO!" },
    "bingo.demo_sec": { ja: "{n}秒", zh: "{n}秒", en: "{n}s" },
    "bingo.demo_game_name": { ja: "デモ観戦（サーバー常時稼働）", zh: "演示观战（服务器 24/7 运行）", en: "Demo Spectator (Server 24/7)" },
    "bingo.demo_badge": { ja: "デモ", zh: "演示", en: "DEMO" },
    "bingo.inactivity_title": { ja: "操作がありません", zh: "长时间未操作", en: "No Activity" },
    "bingo.inactivity_desc": { ja: "司会者の操作が3分間ありませんでした。<br>1分後にこのゲームは自動終了します。", zh: "主持者已 3 分钟未操作。<br>1 分钟后本场游戏将自动结束。", en: "No host activity for 3 minutes.<br>This game will end in 1 minute." },
    "bingo.inactivity_countdown": { ja: "終了まで {n} 秒", zh: "距结束 {n} 秒", en: "{n}s until end" },
    "bingo.inactivity_continue": { ja: "ゲームを続ける", zh: "继续游戏", en: "Continue Game" },
    "bingo.notice_inactivity": { ja: "司会者の無操作によりゲームが終了しました。", zh: "因主持者长时间未操作，游戏已结束。", en: "Game ended due to host inactivity." },
    "bingo.enable_digital_cards": { ja: "デジタルカードを有効にする", zh: "启用数字卡", en: "Enable digital cards" },
    "bingo.physical_card_mode": { ja: "紙のカードモード — 司会のみ（参加不可）", zh: "实体纸片卡模式 — 主持仅司会，不参与游戏", en: "Physical cards — host only, no digital play" },
    "bingo.claim_card": { ja: "デジタルカードを受け取る", zh: "领取数字卡", en: "Claim Digital Card" },
    "bingo.view_card": { ja: "デジタルカードを見る", zh: "查看数字卡", en: "View Digital Card" },
    "bingo.claim_bingo": { ja: "ビンゴ！", zh: "宾果！", en: "BINGO!" },
    "bingo.confirm_winner": { ja: "勝者を確認して続ける", zh: "确认赢家并继续", en: "Confirm winner & continue" },
    "bingo.winner_host_msg": { ja: "勝者: {name}", zh: "赢家：{name}", en: "Winner: {name}" },
    "bingo.winner_self_msg": { ja: "あなたのビンゴ！", zh: "你赢了！", en: "You won!" },
    "bingo.winner_other_msg": { ja: "勝者: {name}", zh: "赢家：{name}", en: "Winner: {name}" },
    "bingo.winner_celebrate": { ja: "おめでとうございます！", zh: "恭喜中奖！", en: "Congratulations!" },
    "bingo.alert_claim_card_fail": { ja: "デジタルカードを受け取れませんでした。", zh: "无法领取数字卡。", en: "Could not claim digital card." },
    "bingo.alert_claim_bingo_fail": { ja: "ビンゴの申告に失敗しました。", zh: "宾果申报失败。", en: "Could not claim BINGO." },
  };

  function getLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.includes(saved)) return saved;
    } catch (_) {}
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
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
    const titleMeta = document.querySelector('meta[name="portal-i18n-title"]');
    if (titleMeta) document.title = t(titleMeta.getAttribute("content"));
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

  function init() {
    const headerMount = document.querySelector("[data-lang-switcher]");
    if (headerMount) injectLangSwitcher(headerMount);
    else {
      const header = document.querySelector(".site-header");
      if (header) injectLangSwitcher(header);
    }
    applyI18n();
  }

  window.YFC_I18N = { getLang, setLang, t, apply: applyI18n, LANGS, messages: M };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
