/**
 * Kaiord Garmin Bridge — Popup
 *
 * Shell layout: status block, capability chips, athlete card (from cached
 * profile-snapshot), sync section (workout-library count + a last-push card),
 * CTA pair. Auto-fetches on open with bounded per-phase timeouts; Retry only
 * appears on user-resolvable failures.
 *
 * A working Connection keeps its useful content (athlete card, sync rollup)
 * and the editor link. Anything else shows one notice with one fix, worded by
 * the vendored connection-notices.js — the same wording the Kaiord App shows.
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
 * The health record follows the same discipline. Only the API verdict is
 * folded into it — a background worker that did not answer says nothing about
 * Garmin — and the dated sentence claims only that Kaiord has read nothing
 * since, which is a fact about this extension rather than about Garmin.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js, bridge-popup-health.js and bridge-popup-snapshot.js
 * (see popup.html script order).
 *
 * No new outbound URLs introduced — privacy-surface guard covers
 * popup.js fetch sites and asserts only relative paths.
 */

/* global msg, $, uiLocale, localizePage, withTimeout, relativeAgo, formatSinceDate, recordProbe,
   renderStatusBlock, renderChips, renderSkeleton, renderCtas, renderBrokenConnection,
   renderAthleteCard, KAIORD_CONNECTION_NOTICES */

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const OPEN_EDITOR_URL = "https://kaiord.com/app/";
const OPEN_GARMIN_URL = "https://connect.garmin.com/modern/";
// The Platform's name exactly as the Kaiord App's registry spells it, so a
// notice reads the same in both (scripts/check-connection-notices.mjs).
const PLATFORM = "Garmin";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  extName: "Kaiord for Garmin",
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause:
    "Reading your Garmin Connect data with access Kaiord minted from an earlier sign-in.",
  outageSince: "Since $1.",
  notChecked: "Not checked yet",
  notCheckedCause:
    "Kaiord asks Garmin Connect the first time it reads or sends, so looking here mints no access.",
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
  openGarmin: "Open Garmin Connect ↗",
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

// Every region any resolved state fills, so the checking layout is the
// resolved layout's height.
const SKELETON_REGIONS = [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "athlete-region", parts: ["block"] },
  { region: "rollup-region", parts: ["caption", "block-sm"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
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

// The one card in the shell that carries a hue. Zone 4 edges it because it is
// naming a real training session rather than a status.
const lastPushCard = (lastPush) => {
  const card = document.createElement("div");
  card.className = "lastpush";
  const meta = document.createElement("div");
  meta.className = "lastpush__meta";
  const rel = relativeAgo(lastPush.at) ?? msg("momentsAgo");
  meta.textContent = `${msg("lastPush")} · ${rel}`;
  card.appendChild(meta);
  if (lastPush.name) {
    const title = document.createElement("div");
    title.className = "lastpush__title";
    title.textContent = lastPush.name;
    card.appendChild(title);
  }
  return card;
};

const renderRollup = (pingData, lastPush) => {
  const region = $("rollup-region");
  region.innerHTML = "";
  const total = pingData?.gcApi?.totalCount;
  const hasTotal = typeof total === "number";
  if (!hasTotal && !lastPush?.at) return;
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = msg("captionSync");
  region.appendChild(caption);
  if (hasTotal) {
    const el = document.createElement("div");
    el.className = "rollup";
    el.textContent = msg("workoutLibrary", [String(total)]);
    region.appendChild(el);
  }
  if (lastPush?.at) region.appendChild(lastPushCard(lastPush));
};

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

const setMarkEstablished = (established) => {
  $("brand-mark").classList.toggle("popup-header__mark--muted", !established);
};

// Only a check Garmin itself answered may say the sign-in is gone: a failed
// read, a timeout or a worker that did not answer is "not-answering", because
// Garmin being unavailable always explains it too (#1100).
// An extension with the cheap check answers the typed `session` outcome;
// only "signed-out" there is Garmin's own refusal.
const TYPED_STATE = {
  "signed-in": "working",
  "signed-out": "signed-out",
  "not-answering": "not-answering",
  "not-checked": "not-checked",
};

const connectionStateOf = (ping) => {
  const typed = ping?.ok ? TYPED_STATE[ping?.data?.session] : undefined;
  if (typed) return typed;
  if (ping?.ok && ping?.data?.gcApi?.ok) return "working";
  if (ping?.ok && ping?.data?.gcApi?.needsReauth === true) return "signed-out";
  return "not-answering";
};

// Any non-working state pauses the flow, so the chips go muted and the notice
// replaces the verdict; its one fix is the whole footer.
const renderBroken = (state, since = null) => {
  renderBrokenConnection(
    $,
    msg,
    KAIORD_CONNECTION_NOTICES.noticeFor(state, PLATFORM, uiLocale()),
    {
      since,
      href: OPEN_GARMIN_URL,
      onRetry: () => loadPopupData(),
      formatSince: formatSinceDate,
    }
  );
  renderChips($, feedChips("muted"), { caption: msg("captionFeeds") });
};

/* The check asked nothing: no still-valid access is held, and minting one to
   look would be the cost the check exists to avoid. Nothing was learned, so
   no outage is recorded and nothing claims the athlete is signed out. */
const renderNotChecked = (storage) => {
  setMarkEstablished(false);
  renderStatusBlock($, msg, {
    tone: "muted",
    mark: "dot",
    verdictKey: "notChecked",
    causeKey: "notCheckedCause",
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  renderAthleteCard(storage.profileSnapshot);
  renderRollup(undefined, storage.lastPushReceipt);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openGarmin"),
    secondaryHref: OPEN_GARMIN_URL,
  });
  showRefresh(true);
};

const loadPopupData = async () => {
  showRefresh(false);
  setMarkEstablished(false);
  renderStatusBlock($, msg, {
    tone: "checking",
    verdictKey: "checking",
    causeKey: "checkingCause",
  });
  renderSkeleton($, SKELETON_REGIONS);

  let storage;
  try {
    storage = await withTimeout(getSnapshot(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    renderAthleteCard(undefined);
    renderBroken("not-answering");
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
    renderBroken("not-answering");
    return;
  }

  const state = connectionStateOf(ping);
  if (state === "not-checked") {
    renderNotChecked(storage);
    return;
  }
  const health = await recordProbe(state === "working");
  if (state !== "working") {
    renderAthleteCard(storage.profileSnapshot);
    renderRollup(ping?.data, storage.lastPushReceipt);
    renderBroken(state, health.since);
    return;
  }

  setMarkEstablished(true);
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
  localizePage();
  loadPopupData();
});
