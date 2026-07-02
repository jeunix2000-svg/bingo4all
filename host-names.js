/**
 * Fun host display names for Bingo4All lobby.
 * User games: random pick with no repeat within 10 days per clientId.
 */
(function () {
  const HISTORY_KEY = "portal_bingo_host_name_history";
  const COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000;

  /** Fixed fun name for the always-on demo game host. */
  const DEMO_LABEL = "Lucky Momo";

  const POOL = [
    "阿光", "阿闪", "阿宾", "阿虎", "阿龙", "小樱", "小布", "小橙", "小七", "小星",
    "小桃", "小云", "小风", "小海", "小仙", "桃桃", "豆豆", "糖糖", "团团", "乐乐",
    "大吉", "小米", "丸子", "布丁", "泡芙", "花卷", "星野", "月见", "晴晴", "麦麦",
    "芒果", "可乐", "橙子", "椰椰", "葡萄", "草莓", "飞飞", "洋洋", "点点", "格格",
    "Lucky", "Sunny", "Coco", "Momo", "Mochi", "Bingo", "Starry", "Neko", "Peach", "Cherry",
    "Lemon", "Maple", "Cookie", "Bubble", "Waffle", "Panda", "Koala", "Comet", "Nova", "Spark",
    "Dash", "Happy", "Pixel", "Glimmer", "Fuzzy", "Bunny", "Otter", "Penguin", "Dolphin", "Foxie",
    "Ziggy", "Zuzu", "Lulu", "Kiki", "Mimi", "Yoyo", "Bobo", "Toto", "Riri", "Nini",
    "Taco", "Mango", "Kiwi", "Melon", "Honey", "Sugar", "Minty", "Berry", "Jelly", "Noodle",
    "Jolly", "Merry", "Breezy", "Chirpy", "Peppy", "Snappy", "Fluffy", "Crispy", "Tangy", "Pickle",
    "Banana", "Potato", "Tomato", "Avocado", "Pretzel", "Muffin", "Cupcake", "Donut", "Pancake", "Nugget",
    "Star", "Moon", "Cloud", "Rainbow", "Rocket", "Beep", "Boop", "Bongo", "Doodle", "Wink",
  ];

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return typeof data === "object" && data !== null ? data : {};
    } catch (_) {
      return {};
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (_) { /* storage full */ }
  }

  function pruneHistory(entries, now) {
    return (entries || []).filter((entry) => now - Number(entry.at || 0) < COOLDOWN_MS);
  }

  function pick(clientId) {
    const cid = String(clientId || "anonymous");
    const now = Date.now();
    const history = loadHistory();
    const recent = pruneHistory(history[cid], now);
    const used = new Set(recent.map((entry) => entry.name));
    let available = POOL.filter((name) => !used.has(name));

    if (!available.length) {
      available = [...POOL];
      if (recent.length) {
        const oldest = recent.reduce((a, b) => (a.at <= b.at ? a : b));
        available = POOL.filter((name) => name !== oldest.name);
        if (!available.length) available = [...POOL];
      }
    }

    const name = available[Math.floor(Math.random() * available.length)];
    recent.push({ name, at: now });
    history[cid] = recent;
    saveHistory(history);
    return name;
  }

  window.BINGO_HOST_NAMES = { DEMO_LABEL, POOL, pick, COOLDOWN_MS };
})();
