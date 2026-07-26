/**
 * Kaiord Garmin Bridge — Popup
 *
 * Identity-card layout: status pill, athlete card (from cached
 * profile-snapshot), sync rollup (workout-library count), deep-link
 * footer. Auto-fetches on open with bounded per-phase timeouts;
 * Retry only appears on user-resolvable failures.
 *
 * Shared helpers (msg/$/withTimeout/relativeAgo/setStatus/renderRetry and
 * the athlete card) load first from the vendored bridge-popup-utils.js and
 * bridge-popup-snapshot.js (see popup.html script order).
 *
 * No new outbound URLs introduced — privacy-surface guard covers
 * popup.js fetch sites and asserts only relative paths.
 */

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const OPEN_EDITOR_URL = "https://kaiord.com/editor/";
const OPEN_GARMIN_URL = "https://connect.garmin.com/modern/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
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

const showRefresh = (visible) => {
  const btn = $("refresh-btn");
  btn.classList.toggle("popup-header__refresh--hidden", !visible);
};

const loadPopupData = async () => {
  showRefresh(false);
  setStatus("checking", "…", msg("checking"), {
    ariaLabel: msg("checkingConnection"),
  });

  let storage;
  try {
    storage = await withTimeout(getSnapshot(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    setStatus("no", "✗", msg("notConnected"));
    renderAthleteCard(undefined);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  let ping;
  try {
    ping = await withTimeout(sendMessage("ping"), PHASE_TIMEOUT_MS, "ping");
  } catch {
    setStatus("no", "✗", msg("notConnected"));
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
    setStatus("no", "✗", msg("notConnectedGarmin"), {
      ariaLabel: msg("notConnected"),
    });
    renderAthleteCard(storage.profileSnapshot);
    renderRollup(ping?.data, storage.lastPushReceipt);
    renderFooter();
    renderRetry(() => loadPopupData());
    return;
  }

  setStatus("ok", "✓", msg("connectedToGarmin"), {
    ariaLabel: msg("connected"),
  });
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
