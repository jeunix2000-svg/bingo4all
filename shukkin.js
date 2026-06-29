(() => {
  function tr(k, vars) {
    return window.YFC_I18N ? YFC_I18N.t(k, vars) : k;
  }

  document.addEventListener("portal-lang-change", () => {
    if (typeof refreshUi === "function") refreshUi();
  });

  const USERS_KEY = "portal_shukkin_users";
  const SESSION_KEY = "portal_shukkin_session";
  const RECORDS_KEY = "portal_shukkin_records";
  const REQUESTS_KEY = "portal_shukkin_requests";
  const INIT_KEY = "portal_shukkin_initialized";

  const ROLE_USER = "user";
  const ROLE_ADMIN = "admin";
  const REQ_PENDING = "pending";
  const REQ_APPROVED = "approved";
  const REQ_REJECTED = "rejected";

  const authView = document.getElementById("auth-view");
  const appView = document.getElementById("app-view");
  const flashEl = document.getElementById("flash");
  const userBarEl = document.getElementById("user-bar");

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function todayKey() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function formatTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDate(dateKey) {
    const parts = dateKey.split("-");
    if (parts.length !== 3) return dateKey;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return "—";
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? tr("shukkin.duration_hm", { h, m }) : tr("shukkin.duration_m", { m });
  }

  function roleLabel(role) {
    return role === ROLE_ADMIN ? tr("shukkin.role_admin") : tr("shukkin.role_user");
  }

  function requestStatusLabel(status) {
    if (status === REQ_PENDING) return tr("shukkin.status_pending");
    if (status === REQ_APPROVED) return tr("shukkin.status_approved");
    if (status === REQ_REJECTED) return tr("shukkin.status_rejected");
    return status;
  }

  function isoFromDateAndTime(dateKey, timeStr) {
    if (!dateKey || !timeStr) return null;
    const d = new Date(`${dateKey}T${timeStr}:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  async function hashPassword(password, salt) {
    const input = salt + password;
    if (typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const data = new TextEncoder().encode(input);
        const buf = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (_) { /* fall through */ }
    }
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) + h + input.charCodeAt(i)) | 0;
    }
    return "fb" + Math.abs(h).toString(16);
  }

  function loadJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadUsers() { return loadJson(USERS_KEY, []); }
  function saveUsers(users) { saveJson(USERS_KEY, users); }
  function loadRecords() { return loadJson(RECORDS_KEY, []); }
  function saveRecords(records) { saveJson(RECORDS_KEY, records); }
  function loadRequests() { return loadJson(REQUESTS_KEY, []); }
  function saveRequests(requests) { saveJson(REQUESTS_KEY, requests); }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, token: newId(), at: new Date().toISOString() }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session?.userId) return null;
    return loadUsers().find((u) => u.id === session.userId) || null;
  }

  function isAdmin(user) {
    return user?.role === ROLE_ADMIN;
  }

  function showFlash(message, kind) {
    if (!flashEl) return;
    flashEl.hidden = false;
    flashEl.className = "flash " + kind;
    flashEl.textContent = message;
    setTimeout(() => { flashEl.hidden = true; }, 3500);
  }

  async function initSystem() {
    if (localStorage.getItem(INIT_KEY)) return;
    const salt = newId();
    const passwordHash = await hashPassword("001root", salt);
    const admin = {
      id: newId(),
      username: "root001",
      email: "root001@yfc.local",
      displayName: "root001",
      role: ROLE_ADMIN,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    saveUsers([admin]);
    localStorage.setItem(INIT_KEY, "1");
  }

  function normalizeRecords(records) {
    let changed = false;
    const normalized = records.map((r) => {
      const copy = { ...r };
      if (!copy.id) { copy.id = newId(); changed = true; }
      return copy;
    });
    if (changed) saveRecords(normalized);
    return normalized;
  }

  function findUserByLogin(login) {
    const value = login.trim().toLowerCase();
    return loadUsers().find((u) =>
      u.username.toLowerCase() === value || u.email.toLowerCase() === value
    ) || null;
  }

  function findTodayRecord(userId) {
    const key = todayKey();
    return loadRecords().find((r) => r.userId === userId && r.date === key) || null;
  }

  function getUserDisplayName(userId) {
    const user = loadUsers().find((u) => u.id === userId);
    return user ? user.displayName : tr("shukkin.unknown");
  }

  function renderAuthView() {
    authView.hidden = false;
    appView.hidden = true;
    if (userBarEl) userBarEl.hidden = true;
  }

  function renderAppView() {
    const user = getCurrentUser();
    if (!user) {
      renderAuthView();
      return;
    }
    authView.hidden = true;
    appView.hidden = false;
    if (userBarEl) {
      userBarEl.hidden = false;
      userBarEl.innerHTML =
        `<span class="user-badge">${escapeHtml(user.displayName)}</span>` +
        `<span class="role-badge ${user.role}">${roleLabel(user.role)}</span>` +
        `<button type="button" class="logout-btn" id="logout-btn">${tr("shukkin.logout")}</button>`;
      document.getElementById("logout-btn")?.addEventListener("click", () => {
        clearSession();
        showFlash(tr("shukkin.flash_logout"), "ok");
        renderAuthView();
      });
    }
    document.querySelectorAll("[data-admin-only]").forEach((el) => {
      el.hidden = !isAdmin(user);
    });
    updatePunchUI();
    renderMyRecords();
    renderMyRequests();
    if (isAdmin(user)) {
      renderAllRecords();
      renderPendingRequests();
      renderUserManagement();
    }
  }

  function updatePunchUI() {
    const user = getCurrentUser();
    const statusValueEl = document.getElementById("status-value");
    const statusTimesEl = document.getElementById("status-times");
    const punchInBtn = document.getElementById("punch-in-btn");
    const punchOutBtn = document.getElementById("punch-out-btn");
    const workerNameEl = document.getElementById("worker-name-display");
    if (!user || !statusValueEl) return;

    if (workerNameEl) workerNameEl.textContent = user.displayName;

    const record = findTodayRecord(user.id);
    if (!record?.clockIn) {
      statusValueEl.textContent = tr("shukkin.status_idle");
      statusValueEl.className = "status-value idle";
      statusTimesEl.textContent = tr("shukkin.today_tpl", { date: formatDate(todayKey()) });
      punchInBtn.disabled = false;
      punchOutBtn.disabled = true;
      return;
    }
    if (!record.clockOut) {
      statusValueEl.textContent = tr("shukkin.status_working");
      statusValueEl.className = "status-value working";
      statusTimesEl.innerHTML = tr("shukkin.times_in_out", { in: escapeHtml(formatTime(record.clockIn)), out: "—" });
      punchInBtn.disabled = true;
      punchOutBtn.disabled = false;
      return;
    }
    statusValueEl.textContent = tr("shukkin.status_done");
    statusValueEl.className = "status-value done";
    statusTimesEl.innerHTML =
      tr("shukkin.times_in_out", { in: escapeHtml(formatTime(record.clockIn)), out: escapeHtml(formatTime(record.clockOut)) }) +
      `<br>${tr("shukkin.work_duration", { d: escapeHtml(formatDuration(new Date(record.clockOut) - new Date(record.clockIn))) })}`;
    punchInBtn.disabled = true;
    punchOutBtn.disabled = true;
  }

  function punchIn() {
    const user = getCurrentUser();
    if (!user) return;
    const records = loadRecords();
    const existing = findTodayRecord(user.id);
    if (existing?.clockIn) {
      showFlash(tr("shukkin.flash_already_in"), "err");
      updatePunchUI();
      return;
    }
    const now = new Date().toISOString();
    if (existing) {
      existing.clockIn = now;
      existing.name = user.displayName;
    } else {
      records.unshift({
        id: newId(),
        userId: user.id,
        name: user.displayName,
        date: todayKey(),
        clockIn: now,
        clockOut: null,
      });
    }
    saveRecords(records);
    updatePunchUI();
    renderMyRecords();
    if (isAdmin(user)) renderAllRecords();
    showFlash(tr("shukkin.flash_punch_in", { time: formatTime(now) }), "ok");
  }

  function punchOut() {
    const user = getCurrentUser();
    if (!user) return;
    const records = loadRecords();
    const record = findTodayRecord(user.id);
    if (!record?.clockIn) {
      showFlash(tr("shukkin.flash_no_in"), "err");
      updatePunchUI();
      return;
    }
    if (record.clockOut) {
      showFlash(tr("shukkin.flash_already_out"), "err");
      updatePunchUI();
      return;
    }
    const now = new Date().toISOString();
    record.clockOut = now;
    saveRecords(records);
    updatePunchUI();
    renderMyRecords();
    if (isAdmin(user)) renderAllRecords();
    showFlash(tr("shukkin.flash_punch_out", { time: formatTime(now) }), "ok");
  }

  function renderMyRecords() {
    const user = getCurrentUser();
    const listEl = document.getElementById("my-record-list");
    const countEl = document.getElementById("my-list-count");
    if (!user || !listEl) return;

    const records = loadRecords()
      .filter((r) => r.userId === user.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    countEl.textContent = tr("shukkin.my_records_count", { n: records.length });
    if (!records.length) {
      listEl.innerHTML = `<p class="empty-msg">${escapeHtml(tr("shukkin.my_records_empty"))}</p>`;
      populateRequestRecordSelect();
      return;
    }

    listEl.innerHTML =
      '<div class="list-head my-head">' +
        `<span>${escapeHtml(tr("shukkin.th_date"))}</span><span>${escapeHtml(tr("shukkin.th_times"))}</span><span>${escapeHtml(tr("shukkin.th_duration"))}</span><span>${escapeHtml(tr("shukkin.th_actions"))}</span>` +
      "</div>" +
      records.map((record) => {
        const duration = record.clockIn && record.clockOut
          ? formatDuration(new Date(record.clockOut) - new Date(record.clockIn))
          : "—";
        return (
          `<div class="list-row my-row" data-record-id="${escapeHtml(record.id)}">` +
            `<span class="list-time">${escapeHtml(formatDate(record.date))}</span>` +
            `<span class="list-time">${escapeHtml(formatTime(record.clockIn))} → ${escapeHtml(formatTime(record.clockOut))}</span>` +
            `<span class="list-duration">${escapeHtml(duration)}</span>` +
            `<button type="button" class="list-btn list-btn-edit" data-action="request-edit" data-record-id="${escapeHtml(record.id)}">${escapeHtml(tr("shukkin.request_edit"))}</button>` +
          "</div>"
        );
      }).join("");

    populateRequestRecordSelect(records);
  }

  function populateRequestRecordSelect(records) {
    const select = document.getElementById("req-record-id");
    if (!select) return;
    const user = getCurrentUser();
    if (!user) return;
    const list = records || loadRecords().filter((r) => r.userId === user.id);
    select.innerHTML = list.map((r) =>
      `<option value="${escapeHtml(r.id)}">${escapeHtml(formatDate(r.date))} (${escapeHtml(formatTime(r.clockIn))}→${escapeHtml(formatTime(r.clockOut))})</option>`
    ).join("");
  }

  function renderMyRequests() {
    const user = getCurrentUser();
    const listEl = document.getElementById("my-request-list");
    const countEl = document.getElementById("my-request-count");
    if (!user || !listEl) return;

    const requests = loadRequests()
      .filter((r) => r.userId === user.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    countEl.textContent = tr("shukkin.my_requests_count", { n: requests.length });
    if (!requests.length) {
      listEl.innerHTML = `<p class="empty-msg">${escapeHtml(tr("shukkin.my_requests_empty"))}</p>`;
      return;
    }

    listEl.innerHTML = requests.map((req) => {
      const record = loadRecords().find((r) => r.id === req.recordId);
      const dateStr = record ? formatDate(record.date) : "—";
      return (
        `<div class="request-item status-${escapeHtml(req.status)}">` +
          `<div class="request-title">${escapeHtml(tr("shukkin.request_title_tpl", { date: dateStr }))}</div>` +
          `<div class="request-meta">` +
            `<span class="req-badge ${escapeHtml(req.status)}">${escapeHtml(requestStatusLabel(req.status))}</span>` +
            `${escapeHtml(tr("shukkin.request_applied"))}${escapeHtml(formatDateTime(req.createdAt))}` +
          `</div>` +
          `<div class="request-body">` +
            `${escapeHtml(tr("shukkin.request_changed"))}${escapeHtml(formatTime(req.requestedClockIn))} → ${escapeHtml(formatTime(req.requestedClockOut))}<br>` +
            `${escapeHtml(tr("shukkin.request_reason"))}${escapeHtml(req.reason)}` +
            (req.reviewNote ? `<br>${escapeHtml(tr("shukkin.admin_comment"))}${escapeHtml(req.reviewNote)}` : "") +
          `</div>` +
        `</div>`
      );
    }).join("");
  }

  function renderAllRecords() {
    const listEl = document.getElementById("admin-record-list");
    const countEl = document.getElementById("admin-list-count");
    if (!listEl) return;

    const records = loadRecords().slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    countEl.textContent = tr("shukkin.admin_all_count", { n: records.length });
    if (!records.length) {
      listEl.innerHTML = `<p class="empty-msg">${escapeHtml(tr("shukkin.admin_records_empty"))}</p>`;
      return;
    }

    listEl.innerHTML =
      '<div class="list-head admin-head">' +
        `<span>${escapeHtml(tr("shukkin.th_user"))}</span><span>${escapeHtml(tr("shukkin.th_date"))}</span><span>${escapeHtml(tr("shukkin.th_times"))}</span><span>${escapeHtml(tr("shukkin.th_actions"))}</span>` +
      "</div>" +
      records.map((record) => {
        const name = record.name || getUserDisplayName(record.userId);
        return (
          `<div class="list-row admin-row" data-record-id="${escapeHtml(record.id)}">` +
            `<span class="list-name">${escapeHtml(name)}</span>` +
            `<span class="list-time">${escapeHtml(formatDate(record.date))}</span>` +
            `<span class="list-time">${escapeHtml(formatTime(record.clockIn))} → ${escapeHtml(formatTime(record.clockOut))}</span>` +
            `<button type="button" class="list-btn list-btn-edit" data-action="admin-edit" data-record-id="${escapeHtml(record.id)}">${escapeHtml(tr("shukkin.btn_edit_direct"))}</button>` +
          "</div>"
        );
      }).join("");
  }

  function renderPendingRequests() {
    const listEl = document.getElementById("admin-request-list");
    const countEl = document.getElementById("admin-request-count");
    if (!listEl) return;

    const pending = loadRequests()
      .filter((r) => r.status === REQ_PENDING)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    countEl.textContent = tr("shukkin.admin_pending_count", { n: pending.length });
    if (!pending.length) {
      listEl.innerHTML = `<p class="empty-msg">${escapeHtml(tr("shukkin.admin_pending_empty"))}</p>`;
      return;
    }

    listEl.innerHTML = pending.map((req) => {
      const user = loadUsers().find((u) => u.id === req.userId);
      const record = loadRecords().find((r) => r.id === req.recordId);
      return (
        `<div class="request-item pending-review" data-request-id="${escapeHtml(req.id)}">` +
          `<div class="request-title">${escapeHtml(user?.displayName || tr("shukkin.unknown"))} — ${escapeHtml(record ? formatDate(record.date) : "—")}</div>` +
          `<div class="request-body">` +
            `${escapeHtml(tr("shukkin.current_times"))}${escapeHtml(formatTime(record?.clockIn))} → ${escapeHtml(formatTime(record?.clockOut))}<br>` +
            `${escapeHtml(tr("shukkin.request_times"))}${escapeHtml(formatTime(req.requestedClockIn))} → ${escapeHtml(formatTime(req.requestedClockOut))}<br>` +
            `${escapeHtml(tr("shukkin.request_reason"))}${escapeHtml(req.reason)}` +
          `</div>` +
          `<div class="btn-row compact">` +
            `<button type="button" class="punch-btn punch-btn-in" data-action="approve-req" data-id="${escapeHtml(req.id)}">${escapeHtml(tr("shukkin.btn_approve"))}</button>` +
            `<button type="button" class="punch-btn punch-btn-out" data-action="reject-req" data-id="${escapeHtml(req.id)}">${escapeHtml(tr("shukkin.btn_reject"))}</button>` +
          `</div>` +
        `</div>`
      );
    }).join("");
  }

  function renderUserManagement() {
    const listEl = document.getElementById("admin-user-list");
    if (!listEl) return;
    const users = loadUsers().slice().sort((a, b) => a.username.localeCompare(b.username));
    listEl.innerHTML =
      '<div class="list-head user-head">' +
        `<span>${escapeHtml(tr("shukkin.th_username"))}</span><span>${escapeHtml(tr("shukkin.th_email"))}</span><span>${escapeHtml(tr("shukkin.add_display"))}</span><span>${escapeHtml(tr("shukkin.add_role"))}</span>` +
      "</div>" +
      users.map((u) =>
        `<div class="list-row user-row">` +
          `<span class="list-name">${escapeHtml(u.username)}</span>` +
          `<span class="list-time">${escapeHtml(u.email)}</span>` +
          `<span class="list-time">${escapeHtml(u.displayName)}</span>` +
          `<span class="role-badge ${escapeHtml(u.role)}">${escapeHtml(roleLabel(u.role))}</span>` +
        `</div>`
      ).join("");
  }

  function prefillRequestForm(recordId) {
    const record = loadRecords().find((r) => r.id === recordId);
    if (!record) return;
    const select = document.getElementById("req-record-id");
    const inInput = document.getElementById("req-clock-in");
    const outInput = document.getElementById("req-clock-out");
    if (select) select.value = record.id;
    if (inInput && record.clockIn) inInput.value = formatTime(record.clockIn);
    if (outInput && record.clockOut) outInput.value = formatTime(record.clockOut);
    document.getElementById("request-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitRequest(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    const recordId = document.getElementById("req-record-id").value;
    const clockInTime = document.getElementById("req-clock-in").value.trim();
    const clockOutTime = document.getElementById("req-clock-out").value.trim();
    const reason = document.getElementById("req-reason").value.trim();

    const record = loadRecords().find((r) => r.id === recordId && r.userId === user.id);
    if (!record) {
      showFlash(tr("shukkin.flash_record_missing"), "err");
      return;
    }
    if (!clockInTime || !clockOutTime || !reason) {
      showFlash(tr("shukkin.flash_req_fields"), "err");
      return;
    }

    const requestedClockIn = isoFromDateAndTime(record.date, clockInTime);
    const requestedClockOut = isoFromDateAndTime(record.date, clockOutTime);
    if (!requestedClockIn || !requestedClockOut) {
      showFlash(tr("shukkin.flash_bad_time"), "err");
      return;
    }
    if (new Date(requestedClockOut) <= new Date(requestedClockIn)) {
      showFlash(tr("shukkin.flash_out_before_in"), "err");
      return;
    }

    const pending = loadRequests().some(
      (r) => r.recordId === recordId && r.userId === user.id && r.status === REQ_PENDING
    );
    if (pending) {
      showFlash(tr("shukkin.flash_pending_exists"), "err");
      return;
    }

    const requests = loadRequests();
    requests.unshift({
      id: newId(),
      userId: user.id,
      recordId,
      requestedClockIn,
      requestedClockOut,
      reason,
      status: REQ_PENDING,
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: "",
    });
    saveRequests(requests);
    document.getElementById("req-reason").value = "";
    renderMyRequests();
    if (isAdmin(user)) renderPendingRequests();
    showFlash(tr("shukkin.flash_req_sent"), "ok");
  }

  function approveRequest(requestId) {
    const admin = getCurrentUser();
    if (!isAdmin(admin)) return;
    const requests = loadRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.status !== REQ_PENDING) return;

    const records = loadRecords();
    const record = records.find((r) => r.id === req.recordId);
    if (!record) {
      showFlash(tr("shukkin.flash_record_missing"), "err");
      return;
    }

    record.clockIn = req.requestedClockIn;
    record.clockOut = req.requestedClockOut;
    req.status = REQ_APPROVED;
    req.reviewedBy = admin.id;
    req.reviewedAt = new Date().toISOString();
    req.reviewNote = tr("shukkin.review_approved");

    saveRecords(records);
    saveRequests(requests);
    renderAppView();
    showFlash(tr("shukkin.flash_req_approved"), "ok");
  }

  function rejectRequest(requestId) {
    const admin = getCurrentUser();
    if (!isAdmin(admin)) return;
    const note = prompt(tr("shukkin.prompt_reject")) || tr("shukkin.review_rejected_default");
    const requests = loadRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.status !== REQ_PENDING) return;

    req.status = REQ_REJECTED;
    req.reviewedBy = admin.id;
    req.reviewedAt = new Date().toISOString();
    req.reviewNote = note;
    saveRequests(requests);
    renderPendingRequests();
    renderMyRequests();
    showFlash(tr("shukkin.flash_req_rejected"), "ok");
  }

  function adminEditRecord(recordId) {
    const admin = getCurrentUser();
    if (!isAdmin(admin)) return;
    const records = loadRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) return;

    const inDefault = record.clockIn ? formatTime(record.clockIn) : "09:00";
    const outDefault = record.clockOut ? formatTime(record.clockOut) : "18:00";
    const newIn = prompt(tr("shukkin.prompt_clock_in"), inDefault);
    if (newIn === null) return;
    const newOut = prompt(tr("shukkin.prompt_clock_out"), outDefault);
    if (newOut === null) return;

    const clockIn = isoFromDateAndTime(record.date, newIn.trim());
    const clockOut = isoFromDateAndTime(record.date, newOut.trim());
    if (!clockIn || !clockOut) {
      showFlash(tr("shukkin.flash_bad_time"), "err");
      return;
    }
    if (new Date(clockOut) <= new Date(clockIn)) {
      showFlash(tr("shukkin.flash_out_before_in"), "err");
      return;
    }

    record.clockIn = clockIn;
    record.clockOut = clockOut;
    saveRecords(records);
    renderAppView();
    showFlash(tr("shukkin.flash_record_updated"), "ok");
  }

  async function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById("login-id").value.trim();
    const password = document.getElementById("login-password").value;
    if (!login || !password) {
      showFlash(tr("shukkin.flash_login_fields"), "err");
      return;
    }
    const user = findUserByLogin(login);
    if (!user) {
      showFlash(tr("shukkin.flash_user_not_found"), "err");
      return;
    }
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      showFlash(tr("shukkin.flash_bad_password"), "err");
      return;
    }
    setSession(user.id);
    document.getElementById("login-form").reset();
    showFlash(tr("shukkin.flash_logged_in"), "ok");
    renderAppView();
  }

  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const displayName = document.getElementById("reg-display-name").value.trim();
    const password = document.getElementById("reg-password").value;
    const password2 = document.getElementById("reg-password2").value;

    if (!username || !email || !displayName || !password) {
      showFlash(tr("shukkin.flash_all_fields"), "err");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFlash(tr("shukkin.flash_bad_email"), "err");
      return;
    }
    if (password.length < 6) {
      showFlash(tr("shukkin.flash_short_password"), "err");
      return;
    }
    if (password !== password2) {
      showFlash(tr("shukkin.flash_password_mismatch"), "err");
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      showFlash(tr("shukkin.flash_username_taken"), "err");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email)) {
      showFlash(tr("shukkin.flash_email_taken"), "err");
      return;
    }

    const salt = newId();
    const passwordHash = await hashPassword(password, salt);
    const user = {
      id: newId(),
      username,
      email,
      displayName,
      role: ROLE_USER,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    document.getElementById("register-form").reset();
    showFlash(tr("shukkin.flash_registered"), "ok");
    switchAuthTab("login");
  }

  async function handleAdminAddUser(e) {
    e.preventDefault();
    const admin = getCurrentUser();
    if (!isAdmin(admin)) {
      showFlash(tr("shukkin.flash_admin_only"), "err");
      return;
    }

    const username = document.getElementById("add-username").value.trim();
    const email = document.getElementById("add-email").value.trim().toLowerCase();
    const displayName = document.getElementById("add-display-name").value.trim();
    const password = document.getElementById("add-password").value;
    const role = document.getElementById("add-role").value;

    if (!username || !email || !displayName || !password) {
      showFlash(tr("shukkin.flash_all_fields"), "err");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFlash(tr("shukkin.flash_bad_email"), "err");
      return;
    }
    if (password.length < 6) {
      showFlash(tr("shukkin.flash_short_password"), "err");
      return;
    }
    if (role !== ROLE_USER && role !== ROLE_ADMIN) {
      showFlash(tr("shukkin.flash_bad_role"), "err");
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      showFlash(tr("shukkin.flash_username_taken"), "err");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email)) {
      showFlash(tr("shukkin.flash_email_taken"), "err");
      return;
    }

    const salt = newId();
    const passwordHash = await hashPassword(password, salt);
    users.push({
      id: newId(),
      username,
      email,
      displayName,
      role,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
    document.getElementById("add-user-form").reset();
    document.getElementById("add-role").value = ROLE_USER;
    renderUserManagement();
    showFlash(tr("shukkin.flash_user_added"), "ok");
  }

  function switchAuthTab(tab) {
    document.querySelectorAll(".auth-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    document.getElementById("login-panel").hidden = tab !== "login";
    document.getElementById("register-panel").hidden = tab !== "register";
  }

  function bindEvents() {
    document.querySelectorAll(".auth-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchAuthTab(btn.dataset.tab));
    });
    document.getElementById("login-form")?.addEventListener("submit", handleLogin);
    document.getElementById("register-form")?.addEventListener("submit", handleRegister);
    document.getElementById("punch-in-btn")?.addEventListener("click", punchIn);
    document.getElementById("punch-out-btn")?.addEventListener("click", punchOut);
    document.getElementById("request-form")?.addEventListener("submit", submitRequest);
    document.getElementById("add-user-form")?.addEventListener("submit", handleAdminAddUser);

    document.getElementById("my-record-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='request-edit']");
      if (btn) prefillRequestForm(btn.dataset.recordId);
    });

    document.getElementById("admin-record-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='admin-edit']");
      if (btn) adminEditRecord(btn.dataset.recordId);
    });

    document.getElementById("admin-request-list")?.addEventListener("click", (e) => {
      const approveBtn = e.target.closest("[data-action='approve-req']");
      const rejectBtn = e.target.closest("[data-action='reject-req']");
      if (approveBtn) approveRequest(approveBtn.dataset.id);
      if (rejectBtn) rejectRequest(rejectBtn.dataset.id);
    });
  }

  async function boot() {
    await initSystem();
    normalizeRecords(loadRecords());
    bindEvents();
    if (getCurrentUser()) renderAppView();
    else renderAuthView();
  }

  function refreshUi() {
    if (window.YFC_I18N) YFC_I18N.apply();
    if (getCurrentUser()) renderAppView();
    else renderAuthView();
  }

  boot();
})();
