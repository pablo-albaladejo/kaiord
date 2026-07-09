/**
 * Kaiord Train2Go Bridge — Popup
 *
 * Identity-card layout: status pill (with optional coach sub-line),
 * athlete card from cached profile-snapshot, weekly rollup
 * "<N> sessions planned · <M> done · workload <X>" with a 5-minute
 * `lastWeeklyRollup` TTL cache, deep-link footer. Auto-fetches on
 * open with bounded per-phase timeouts (snapshot 1 s, ping 3 s,
 * rollup 8 s). Retry only appears on user-resolvable failures;
 * rollup-only timeout preserves the connected state.
 */

// Vendored from @kaiord/core's STALE_SNAPSHOT_THRESHOLD_DAYS.
// Parity is enforced by check-bridge-stale-threshold-parity (PR7).
const STALE_SNAPSHOT_THRESHOLD_DAYS = 7;

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const ROLLUP_TIMEOUT_MS = 8_000;
const ROLLUP_TTL_MS = 5 * 60 * 1_000;

const OPEN_EDITOR_URL = "https://kaiord.com/editor/";
const OPEN_TRAIN2GO_URL = "https://app.train2go.com/user/index";

// ── i18n ──
// Byte-identical English fallback for environments without chrome.i18n
// (vitest/jsdom). At runtime the browser's chrome.i18n.getMessage returns
// the active-locale string from _locales/. Positional $1/$2 tokens mirror
// the named placeholders declared in _locales/*/messages.json.
const EN_FALLBACK = {
  checking: "Checking…",
  checkingConnection: "Checking connection",
  notConnected: "Not connected",
  notConnectedLogin: "Not connected. Log in to Train2Go.",
  connectedAs: "Connected as $1",
  connectedToTrain2go: "Connected to Train2Go",
  connected: "Connected",
  coachSub: "Coach · $1",
  profileStale: "Profile snapshot is stale. Open Kaiord to refresh.",
  noProfile: "No profile yet. Open Kaiord to set FTP, pace, and HR.",
  noThresholds:
    "Profile has no thresholds yet. Open Kaiord to set FTP, pace, and HR.",
  labelSport: "Sport",
  labelPace: "Pace",
  labelMaxHr: "Max HR",
  labelWeight: "Weight",
  captionThisWeek: "This week",
  rollupSummary: "$1 sessions planned · $2 done · workload $3",
  rollupUnavailable: "Rollup unavailable — try again",
  coachNotes: "Coach notes",
  updatedAgo: "Updated $1",
  updatedJustNow: "Updated just now",
  minuteAgo: "$1 minute ago",
  minutesAgo: "$1 minutes ago",
  hourAgo: "$1 hour ago",
  hoursAgo: "$1 hours ago",
  dayAgo: "$1 day ago",
  daysAgo: "$1 days ago",
  openEditor: "Open editor",
  openEditorAria: "Open Kaiord editor",
  openTrain2go: "Open Train2Go ↗",
  openTrain2goAria: "Open Train2Go",
  retry: "Retry",
  refresh: "Refresh",
};

const applySubs = (template, subs) => {
  if (subs == null) return template;
  const list = Array.isArray(subs) ? subs : [subs];
  return template.replace(/\$(\d)/g, (_, i) =>
    String(list[Number(i) - 1] ?? "")
  );
};

const msg = (key, subs) =>
  globalThis.chrome?.i18n?.getMessage?.(key, subs) ||
  applySubs(EN_FALLBACK[key], subs);

const $ = (id) => document.getElementById(id);

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const readStorage = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["profileSnapshot", "lastWeeklyRollup"], (rs) =>
      resolve(rs ?? {})
    );
  });

const writeRollup = (rollup) =>
  new Promise((resolve) => {
    chrome.storage.local.set(
      { lastWeeklyRollup: { ...rollup, cachedAt: Date.now() } },
      resolve
    );
  });

const todayISO = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const isFresh = (snapshot) => {
  if (!snapshot?.receivedAt) return false;
  return (
    Date.now() - snapshot.receivedAt <
    STALE_SNAPSHOT_THRESHOLD_DAYS * 24 * 60 * 60 * 1_000
  );
};

const isFreshRollup = (rollup) =>
  Boolean(rollup?.cachedAt && Date.now() - rollup.cachedAt < ROLLUP_TTL_MS);

const relativeAgo = (epochMs) => {
  const sec = Math.floor((Date.now() - epochMs) / 1_000);
  if (sec < 60) return null;
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return msg(min === 1 ? "minuteAgo" : "minutesAgo", [String(min)]);
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return msg(hr === 1 ? "hourAgo" : "hoursAgo", [String(hr)]);
  }
  const day = Math.floor(hr / 24);
  return msg(day === 1 ? "dayAgo" : "daysAgo", [String(day)]);
};

const formatRelative = (epochMs) => {
  const ago = relativeAgo(epochMs);
  return ago ? msg("updatedAgo", [ago]) : msg("updatedJustNow");
};

const setStatus = (kind, glyph, text, sub, ariaLabel) => {
  const el = $("status");
  el.className = `status status--${kind}`;
  el.setAttribute("aria-label", ariaLabel ?? text);
  el.querySelector(".status__glyph").textContent = glyph;
  $("status-text").textContent = text;
  const subEl = $("status-sub");
  if (sub) {
    subEl.textContent = sub;
    subEl.hidden = false;
  } else {
    subEl.textContent = "";
    subEl.hidden = true;
  }
};

const collectFields = (snapshot) => {
  const out = [];
  if (snapshot.activeSport) {
    out.push({ label: msg("labelSport"), value: snapshot.activeSport });
  }
  if (snapshot.thresholds?.cycling?.ftp) {
    out.push({ label: "FTP", value: `${snapshot.thresholds.cycling.ftp} W` });
  }
  if (snapshot.thresholds?.running?.thresholdPaceSecPerKm) {
    const s = snapshot.thresholds.running.thresholdPaceSecPerKm;
    out.push({
      label: msg("labelPace"),
      value: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} /km`,
    });
  }
  if (snapshot.heartRate?.lthr) {
    out.push({ label: "LTHR", value: `${snapshot.heartRate.lthr} bpm` });
  }
  if (snapshot.heartRate?.max) {
    out.push({
      label: msg("labelMaxHr"),
      value: `${snapshot.heartRate.max} bpm`,
    });
  }
  if (snapshot.profile?.bodyWeight) {
    out.push({
      label: msg("labelWeight"),
      value: `${snapshot.profile.bodyWeight} kg`,
    });
  }
  return out;
};

const renderAthleteCard = (snapshot) => {
  const region = $("athlete-region");
  region.innerHTML = "";
  if (!snapshot || !isFresh(snapshot)) {
    const el = document.createElement("div");
    el.className = "athlete athlete--placeholder";
    el.textContent = snapshot ? msg("profileStale") : msg("noProfile");
    region.appendChild(el);
    return;
  }
  const fields = collectFields(snapshot);
  if (fields.length === 0) {
    const el = document.createElement("div");
    el.className = "athlete athlete--placeholder";
    el.textContent = msg("noThresholds");
    region.appendChild(el);
    return;
  }
  const grid = document.createElement("div");
  grid.className = fields.length === 1 ? "athlete athlete--single" : "athlete";
  for (const f of fields) {
    const cell = document.createElement("div");
    cell.className = "athlete__cell";
    const label = document.createElement("span");
    label.className = "athlete__label";
    label.textContent = f.label;
    const value = document.createElement("span");
    value.className = "athlete__value";
    value.textContent = f.value;
    cell.append(label, value);
    grid.appendChild(cell);
  }
  const updated = document.createElement("div");
  updated.className = "athlete__updated";
  updated.setAttribute("aria-live", "polite");
  updated.textContent = formatRelative(snapshot.receivedAt);
  grid.appendChild(updated);
  region.appendChild(grid);
};

const summariseRollup = (activities) => {
  let planned = 0;
  let done = 0;
  let workload = 0;
  for (const a of activities ?? []) {
    planned += 1;
    if (a.status === 1) done += 1;
    if (typeof a.workload === "number") workload += a.workload;
  }
  return { planned, done, workload };
};

const renderRollup = (rollup) => {
  const region = $("rollup-region");
  region.innerHTML = "";
  if (!rollup) return;
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = msg("captionThisWeek");
  region.appendChild(caption);
  const line = document.createElement("div");
  line.className = "rollup";
  line.textContent = msg("rollupSummary", [
    String(rollup.planned),
    String(rollup.done),
    String(rollup.workload),
  ]);
  region.appendChild(line);
};

const renderRollupUnavailable = () => {
  const region = $("rollup-region");
  region.innerHTML = "";
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = msg("captionThisWeek");
  region.appendChild(caption);
  const el = document.createElement("div");
  el.className = "rollup rollup--unavailable";
  el.textContent = msg("rollupUnavailable");
  region.appendChild(el);
};

// Render the trainer's free-text notes about the trainee inside a
// collapsible <details> box. The body is set via textContent — never
// innerHTML — so HTML in the upstream payload cannot inject markup.
// `parsePingJson` already strips tags upstream; this is defense in
// depth.
const renderNotes = (notes) => {
  const region = $("notes-region");
  region.innerHTML = "";
  if (typeof notes !== "string" || notes.length === 0) return;

  const details = document.createElement("details");
  details.className = "notes";

  const summary = document.createElement("summary");
  summary.className = "notes__summary";
  summary.textContent = msg("coachNotes");
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "notes__body";
  body.textContent = notes;
  details.appendChild(body);

  region.appendChild(details);
};

const renderFooter = () => {
  const region = $("footer-region");
  region.innerHTML = "";
  const primary = document.createElement("a");
  primary.href = OPEN_EDITOR_URL;
  primary.target = "_blank";
  primary.rel = "noopener";
  primary.className = "cta-primary";
  primary.textContent = msg("openEditor");
  primary.setAttribute("aria-label", msg("openEditorAria"));
  const secondary = document.createElement("a");
  secondary.href = OPEN_TRAIN2GO_URL;
  secondary.target = "_blank";
  secondary.rel = "noopener";
  secondary.className = "cta-secondary";
  secondary.textContent = msg("openTrain2go");
  secondary.setAttribute("aria-label", msg("openTrain2goAria"));
  region.append(primary, secondary);
};

const renderRetry = (onClick) => {
  const region = $("footer-region");
  region.innerHTML = "";
  const btn = document.createElement("button");
  btn.id = "retry-btn";
  btn.type = "button";
  btn.className = "cta-retry";
  btn.textContent = msg("retry");
  btn.addEventListener("click", onClick);
  region.appendChild(btn);
  btn.focus();
};

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

const fetchRollup = async (userId, bypassTtl) => {
  const storage = await readStorage();
  if (!bypassTtl && isFreshRollup(storage.lastWeeklyRollup)) {
    return storage.lastWeeklyRollup;
  }
  const res = await sendMessage({
    action: "read-week",
    date: todayISO(),
    userId,
  });
  if (!res?.ok) throw new Error(res?.error ?? "read-week failed");
  const summary = summariseRollup(res.data?.activities);
  await writeRollup(summary);
  return summary;
};

const loadPopupData = async ({ bypassTtl = false } = {}) => {
  showRefresh(false);
  setStatus("checking", "…", msg("checking"), null, msg("checkingConnection"));

  let storage;
  try {
    storage = await withTimeout(readStorage(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    setStatus("no", "✗", msg("notConnected"), null, msg("notConnected"));
    renderAthleteCard(undefined);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  let ping;
  try {
    ping = await withTimeout(
      sendMessage({ action: "ping" }),
      PHASE_TIMEOUT_MS,
      "ping"
    );
  } catch {
    setStatus("no", "✗", msg("notConnected"), null, msg("notConnected"));
    renderAthleteCard(storage.profileSnapshot);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  const sessionActive = ping?.data?.sessionActive;
  if (!ping?.ok || !sessionActive) {
    setStatus("no", "✗", msg("notConnectedLogin"), null, msg("notConnected"));
    renderAthleteCard(storage.profileSnapshot);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  const userName = ping.data.userName;
  const coachName = ping.data.coachName;
  setStatus(
    "ok",
    "✓",
    userName ? msg("connectedAs", [userName]) : msg("connectedToTrain2go"),
    coachName ? msg("coachSub", [coachName]) : null,
    msg("connected")
  );
  renderAthleteCard(storage.profileSnapshot);
  renderNotes(ping.data.notes);
  renderFooter();

  // Rollup phase — failure here keeps the connected state.
  const userId = ping.data.userId;
  if (typeof userId === "number") {
    try {
      const rollup = await withTimeout(
        fetchRollup(userId, bypassTtl),
        ROLLUP_TIMEOUT_MS,
        "rollup"
      );
      renderRollup(rollup);
    } catch {
      renderRollupUnavailable();
    }
  }

  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () =>
  loadPopupData({ bypassTtl: true })
);

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  loadPopupData();
});
