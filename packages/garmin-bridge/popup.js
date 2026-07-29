/**
 * Kaiord Garmin Bridge — Popup
 *
 * Shell layout: status block, capability chips, athlete card (from cached
 * profile-snapshot), sync rollup (workout-library count + last push), CTA
 * pair. Auto-fetches on open with bounded per-phase timeouts; Retry only
 * appears on user-resolvable failures.
 *
 * The primary CTA is whatever fixes the current state: signing back in at
 * Garmin Connect when Kaiord has no working access, opening the Kaiord editor
 * when data flows.
 *
 * The copy deliberately does NOT say the bridge rides a Garmin Connect
 * session. It does not: garmin-oauth.js exchanges the browser SSO session ONCE
 * for OAuth tokens and keeps the OAuth1 token (~1 year) in
 * chrome.storage.local, so a data call carries that bearer alone under
 * `credentials: "omit"` and reads keep working after the user signs out — for
 * as long as the current bearer is valid. Past its expiry the bearer is
 * refreshed through the exchange, which IS sent with `credentials: "include"`,
 * so whether reads survive that far is not something this code establishes
 * (#1102).
 *
 * The rule the copy follows does not rest on any of that. A failed check is
 * not evidence the user is signed out for a simpler reason: a failure can
 * always be Garmin being unavailable. That holds however the refresh turns out
 * to authenticate, so softening the paragraph above must not be read as
 * weakening the rule. Signing in again is still the useful action, because it
 * lets the bridge re-mint; it is just not a diagnosis.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js and bridge-popup-snapshot.js (see popup.html script
 * order).
 *
 * No new outbound URLs introduced — privacy-surface guard covers
 * popup.js fetch sites and asserts only relative paths.
 */

/* global msg, $, withTimeout, relativeAgo, renderRetry, renderStatusBlock,
   renderChips, renderSkeleton, renderCtas, renderAthleteCard */

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const OPEN_EDITOR_URL = "https://kaiord.com/editor/";
const OPEN_GARMIN_URL = "https://connect.garmin.com/modern/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause:
    "Reading your Garmin Connect data with access Kaiord minted from an earlier sign-in.",
  noGarminAccess: "No access to Garmin Connect",
  noGarminAccessCause:
    "Kaiord could not read from Garmin Connect. Signing in again mints fresh access; if you are already signed in, Garmin may be temporarily unavailable.",
  bridgeNotResponding: "Bridge not responding",
  bridgeNotRespondingCause:
    "The extension's background worker did not answer. Try again.",
  captionFeeds: "Feeds Kaiord",
  typeActivity: "Activity",
  typeWorkoutBack: "Workout ↑ to Garmin",
  typeBodyCompositionBack: "Body Composition ↑ to Garmin",
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
  openEditor: "Open Kaiord editor",
  signInGarmin: "Sign in to Garmin Connect",
  openGarmin: "Open Garmin Connect ↗",
  retry: "Retry",
  refresh: "Refresh",
};

// Managed data types this bridge moves, named exactly as the Connections page
// names them (@kaiord/core MANAGED_DATA_REGISTRY labels). `read:activities`
// imports; `write:workouts` and `write:body` push back out.
const FEED_KEYS = [
  { key: "typeActivity" },
  { key: "typeWorkoutBack", modifier: "out" },
  { key: "typeBodyCompositionBack", modifier: "out" },
];

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

const feedChips = (modifier) =>
  FEED_KEYS.map((entry) => ({
    label: msg(entry.key),
    modifier: modifier ?? entry.modifier,
  }));

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

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

// Any non-connected state pauses the flow, so the chips go muted and the
// primary CTA becomes the fix rather than the editor link.
const renderBroken = ({ verdictKey, causeKey }) => {
  renderStatusBlock($, msg, { tone: "warn", verdictKey, causeKey });
  renderChips($, feedChips("muted"), { caption: msg("captionFeeds") });
  renderCtas($, {
    primaryLabel: msg("signInGarmin"),
    primaryHref: OPEN_GARMIN_URL,
    secondaryLabel: msg("openEditor"),
    secondaryHref: OPEN_EDITOR_URL,
  });
  renderRetry(() => loadPopupData());
};

const loadPopupData = async () => {
  showRefresh(false);
  renderStatusBlock($, msg, {
    tone: "muted",
    verdictKey: "checking",
    causeKey: "checkingCause",
  });
  renderSkeleton($);

  let storage;
  try {
    storage = await withTimeout(getSnapshot(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    renderAthleteCard(undefined);
    renderBroken({
      verdictKey: "bridgeNotResponding",
      causeKey: "bridgeNotRespondingCause",
    });
    return;
  }

  let ping;
  try {
    ping = await withTimeout(sendMessage("ping"), PHASE_TIMEOUT_MS, "ping");
  } catch {
    renderAthleteCard(storage.profileSnapshot);
    // lastPushReceipt is independent of the Garmin Connect session;
    // it tells the user when the SPA last synced their profile, which
    // is useful even when Garmin Connect is unreachable.
    renderRollup(undefined, storage.lastPushReceipt);
    renderBroken({
      verdictKey: "bridgeNotResponding",
      causeKey: "bridgeNotRespondingCause",
    });
    return;
  }

  const apiOk = ping?.data?.gcApi?.ok;
  if (!ping?.ok || !apiOk) {
    renderAthleteCard(storage.profileSnapshot);
    renderRollup(ping?.data, storage.lastPushReceipt);
    renderBroken({
      verdictKey: "noGarminAccess",
      causeKey: "noGarminAccessCause",
    });
    return;
  }

  renderStatusBlock($, msg, {
    tone: "ok",
    verdictKey: "connected",
    causeKey: "connectedCause",
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  renderAthleteCard(storage.profileSnapshot);
  renderRollup(ping.data, storage.lastPushReceipt);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openGarmin"),
    secondaryHref: OPEN_GARMIN_URL,
  });
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => loadPopupData());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  loadPopupData();
});
