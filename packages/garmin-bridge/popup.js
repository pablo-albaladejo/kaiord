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
const OPEN_EDITOR_URL = "https://app.kaiord.com/";
const OPEN_GARMIN_URL = "https://connect.garmin.com/modern/";

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

const renderRollup = (pingData, lastPush) => {
  const region = $("rollup-region");
  region.innerHTML = "";
  const total = pingData?.gcApi?.totalCount;
  const lines = [];
  if (typeof total === "number") {
    lines.push(`Workout library · ${total} workouts`);
  }
  if (lastPush?.at) {
    const rel = formatRelative(lastPush.at)
      .replace(/^Updated /, "")
      .replace(/^just now$/, "moments ago");
    const name = lastPush.name ? ` — “${lastPush.name}”` : "";
    lines.push(`Last push · ${rel}${name}`);
  }
  if (lines.length === 0) return;
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = "Sync";
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
  primary.textContent = "Open editor";
  primary.setAttribute("aria-label", "Open Kaiord editor");
  const secondary = document.createElement("a");
  secondary.href = OPEN_GARMIN_URL;
  secondary.target = "_blank";
  secondary.rel = "noopener";
  secondary.className = "cta-secondary";
  secondary.textContent = "Open Garmin Connect ↗";
  secondary.setAttribute("aria-label", "Open Garmin Connect");
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
  const btn = $("refresh-btn");
  btn.classList.toggle("popup-header__refresh--hidden", !visible);
};

const loadPopupData = async () => {
  showRefresh(false);
  setStatus("checking", "…", "Checking…", "Checking connection");

  let storage;
  try {
    storage = await withTimeout(getSnapshot(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    setStatus("no", "✗", "Not connected", "Not connected");
    renderAthleteCard(undefined);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  let ping;
  try {
    ping = await withTimeout(sendMessage("ping"), PHASE_TIMEOUT_MS, "ping");
  } catch {
    setStatus("no", "✗", "Not connected", "Not connected");
    renderAthleteCard(storage.profileSnapshot);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  const apiOk = ping?.data?.gcApi?.ok;
  if (!ping?.ok || !apiOk) {
    setStatus(
      "no",
      "✗",
      "Not connected — open Garmin Connect and refresh",
      "Not connected"
    );
    renderAthleteCard(storage.profileSnapshot);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  setStatus("ok", "✓", "Connected to Garmin Connect", "Connected");
  renderAthleteCard(storage.profileSnapshot);
  renderRollup(ping.data, storage.lastPushReceipt);
  renderFooter();
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => loadPopupData());

window.addEventListener("DOMContentLoaded", () => {
  loadPopupData();
});
