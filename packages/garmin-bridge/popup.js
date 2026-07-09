/**
 * Kaiord Garmin Bridge — Popup
 *
 * Identity-card layout: status pill, athlete card (from cached
 * profile-snapshot), sync rollup (workout-library count), deep-link
 * footer. Auto-fetches on open with bounded per-phase timeouts;
 * Retry only appears on user-resolvable failures.
 *
 * No new outbound URLs introduced — privacy-surface guard covers
 * popup.js fetch sites and asserts only relative paths.
 */

// Vendored from @kaiord/core's STALE_SNAPSHOT_THRESHOLD_DAYS.
// Parity is enforced by check-bridge-stale-threshold-parity (PR7).
const STALE_SNAPSHOT_THRESHOLD_DAYS = 7;

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const OPEN_EDITOR_URL = "https://kaiord.com/editor/";
const OPEN_GARMIN_URL = "https://connect.garmin.com/modern/";

// ── i18n ──
// Byte-identical English fallback for environments without chrome.i18n
// (vitest/jsdom). At runtime the browser's chrome.i18n.getMessage returns
// the active-locale string from _locales/. Positional $1 tokens mirror the
// named placeholders declared in _locales/*/messages.json.
const EN_FALLBACK = {
  checking: "Checking…",
  checkingConnection: "Checking connection",
  notConnected: "Not connected",
  notConnectedGarmin: "Not connected — open Garmin Connect and refresh",
  connectedToGarmin: "Connected to Garmin Connect",
  connected: "Connected",
  profileStale: "Profile snapshot is stale. Open Kaiord to refresh.",
  noProfile: "No profile yet. Open Kaiord to set FTP, pace, and HR.",
  noThresholds:
    "Profile has no thresholds yet. Open Kaiord to set FTP, pace, and HR.",
  labelSport: "Sport",
  labelPace: "Pace",
  labelMaxHr: "Max HR",
  labelWeight: "Weight",
  workoutLibrary: "Workout library · $1 workouts",
  lastPush: "Last push",
  captionSync: "Sync",
  updatedAgo: "Updated $1",
  updatedJustNow: "Updated just now",
  momentsAgo: "moments ago",
  minuteAgo: "$1 minute ago",
  minutesAgo: "$1 minutes ago",
  hourAgo: "$1 hour ago",
  hoursAgo: "$1 hours ago",
  dayAgo: "$1 day ago",
  daysAgo: "$1 days ago",
  openEditor: "Open editor",
  openEditorAria: "Open Kaiord editor",
  openGarmin: "Open Garmin Connect ↗",
  openGarminAria: "Open Garmin Connect",
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

const sendMessage = (action) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ action }, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const getSnapshot = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["profileSnapshot", "lastPushReceipt"], (rs) => {
      resolve(rs ?? {});
    });
  });

const isFresh = (snapshot) => {
  if (!snapshot?.receivedAt) return false;
  const ageMs = Date.now() - snapshot.receivedAt;
  return ageMs < STALE_SNAPSHOT_THRESHOLD_DAYS * 24 * 60 * 60 * 1_000;
};

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

const setStatus = (kind, glyph, text, ariaLabel) => {
  const el = $("status");
  el.className = `status status--${kind}`;
  el.setAttribute("aria-label", ariaLabel ?? text);
  el.querySelector(".status__glyph").textContent = glyph;
  $("status-text").textContent = text;
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

const renderRollup = (pingData, lastPush) => {
  const region = $("rollup-region");
  region.innerHTML = "";
  const total = pingData?.gcApi?.totalCount;
  const lines = [];
  if (typeof total === "number") {
    lines.push(msg("workoutLibrary", [String(total)]));
  }
  if (lastPush?.at) {
    const rel = relativeAgo(lastPush.at) ?? msg("momentsAgo");
    const name = lastPush.name ? ` — “${lastPush.name}”` : "";
    lines.push(`${msg("lastPush")} · ${rel}${name}`);
  }
  if (lines.length === 0) return;
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = msg("captionSync");
  region.appendChild(caption);
  for (const line of lines) {
    const el = document.createElement("div");
    el.className = "rollup";
    el.textContent = line;
    region.appendChild(el);
  }
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
  secondary.href = OPEN_GARMIN_URL;
  secondary.target = "_blank";
  secondary.rel = "noopener";
  secondary.className = "cta-secondary";
  secondary.textContent = msg("openGarmin");
  secondary.setAttribute("aria-label", msg("openGarminAria"));
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
  const btn = $("refresh-btn");
  btn.classList.toggle("popup-header__refresh--hidden", !visible);
};

const loadPopupData = async () => {
  showRefresh(false);
  setStatus("checking", "…", msg("checking"), msg("checkingConnection"));

  let storage;
  try {
    storage = await withTimeout(getSnapshot(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    setStatus("no", "✗", msg("notConnected"), msg("notConnected"));
    renderAthleteCard(undefined);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  let ping;
  try {
    ping = await withTimeout(sendMessage("ping"), PHASE_TIMEOUT_MS, "ping");
  } catch {
    setStatus("no", "✗", msg("notConnected"), msg("notConnected"));
    renderAthleteCard(storage.profileSnapshot);
    // lastPushReceipt is independent of the Garmin Connect session;
    // it tells the user when the SPA last synced their profile, which
    // is useful even when Garmin Connect is unreachable.
    renderRollup(undefined, storage.lastPushReceipt);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  const apiOk = ping?.data?.gcApi?.ok;
  if (!ping?.ok || !apiOk) {
    setStatus("no", "✗", msg("notConnectedGarmin"), msg("notConnected"));
    renderAthleteCard(storage.profileSnapshot);
    renderRollup(ping?.data, storage.lastPushReceipt);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  setStatus("ok", "✓", msg("connectedToGarmin"), msg("connected"));
  renderAthleteCard(storage.profileSnapshot);
  renderRollup(ping.data, storage.lastPushReceipt);
  renderFooter();
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => loadPopupData());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  loadPopupData();
});
