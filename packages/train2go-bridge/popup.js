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

const OPEN_EDITOR_URL = "https://app.kaiord.com/";
const OPEN_TRAIN2GO_URL = "https://app.train2go.com/user/index";

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

const formatRelative = (epochMs) => {
  const ageMs = Date.now() - epochMs;
  const sec = Math.floor(ageMs / 1_000);
  if (sec < 60) return "Updated just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Updated ${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Updated ${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `Updated ${day} day${day === 1 ? "" : "s"} ago`;
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
    out.push({ label: "Sport", value: snapshot.activeSport });
  }
  if (snapshot.thresholds?.cycling?.ftp) {
    out.push({ label: "FTP", value: `${snapshot.thresholds.cycling.ftp} W` });
  }
  if (snapshot.thresholds?.running?.thresholdPaceSecPerKm) {
    const s = snapshot.thresholds.running.thresholdPaceSecPerKm;
    out.push({
      label: "Pace",
      value: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} /km`,
    });
  }
  if (snapshot.heartRate?.lthr) {
    out.push({ label: "LTHR", value: `${snapshot.heartRate.lthr} bpm` });
  }
  if (snapshot.heartRate?.max) {
    out.push({ label: "Max HR", value: `${snapshot.heartRate.max} bpm` });
  }
  if (snapshot.profile?.bodyWeight) {
    out.push({
      label: "Weight",
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
    el.textContent = snapshot
      ? "Profile snapshot is stale. Open Kaiord to refresh."
      : "No profile yet. Open Kaiord to set FTP, pace, and HR.";
    region.appendChild(el);
    return;
  }
  const fields = collectFields(snapshot);
  if (fields.length === 0) {
    const el = document.createElement("div");
    el.className = "athlete athlete--placeholder";
    el.textContent =
      "Profile has no thresholds yet. Open Kaiord to set FTP, pace, and HR.";
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
  caption.textContent = "This week";
  region.appendChild(caption);
  const line = document.createElement("div");
  line.className = "rollup";
  line.textContent = `${rollup.planned} sessions planned · ${rollup.done} done · workload ${rollup.workload}`;
  region.appendChild(line);
};

const renderRollupUnavailable = () => {
  const region = $("rollup-region");
  region.innerHTML = "";
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = "This week";
  region.appendChild(caption);
  const el = document.createElement("div");
  el.className = "rollup rollup--unavailable";
  el.textContent = "Rollup unavailable — try again";
  region.appendChild(el);
};

const renderFooter = () => {
  const region = $("footer-region");
  region.innerHTML = "";
  const primary = document.createElement("a");
  primary.href = OPEN_EDITOR_URL;
  primary.target = "_blank";
  primary.rel = "noopener";
  primary.className = "cta-primary";
  primary.textContent = "Open editor";
  primary.setAttribute("aria-label", "Open Kaiord editor");
  const secondary = document.createElement("a");
  secondary.href = OPEN_TRAIN2GO_URL;
  secondary.target = "_blank";
  secondary.rel = "noopener";
  secondary.className = "cta-secondary";
  secondary.textContent = "Open Train2Go ↗";
  secondary.setAttribute("aria-label", "Open Train2Go");
  region.append(primary, secondary);
};

const renderRetry = (onClick) => {
  const region = $("footer-region");
  region.innerHTML = "";
  const btn = document.createElement("button");
  btn.id = "retry-btn";
  btn.type = "button";
  btn.className = "cta-retry";
  btn.textContent = "Retry";
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
  setStatus("checking", "…", "Checking…", null, "Checking connection");

  let storage;
  try {
    storage = await withTimeout(readStorage(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    setStatus("no", "✗", "Not connected", null, "Not connected");
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
    setStatus("no", "✗", "Not connected", null, "Not connected");
    renderAthleteCard(storage.profileSnapshot);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  const sessionActive = ping?.data?.sessionActive;
  if (!ping?.ok || !sessionActive) {
    setStatus(
      "no",
      "✗",
      "Not connected. Log in to Train2Go.",
      null,
      "Not connected"
    );
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
    userName ? `Connected as ${userName}` : "Connected to Train2Go",
    coachName ? `Coach · ${coachName}` : null,
    "Connected"
  );
  renderAthleteCard(storage.profileSnapshot);
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
  loadPopupData();
});
