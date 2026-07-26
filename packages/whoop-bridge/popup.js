/**
 * Kaiord WHOOP Bridge — Popup
 *
 * Session-piggyback status: it reports whether a WHOOP session bearer has been
 * captured. There is no credential entry and no OAuth flow — the bridge rides
 * the user's own session. All logic talks to background.js via internal
 * runtime messages.
 *
 * The primary CTA is whatever fixes the current state: signing back in at
 * WHOOP when the session is gone, opening the Kaiord editor when data flows.
 * A signed-out session names its consequence — the health types that stop
 * arriving — instead of only reporting the failure.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js and
 * bridge-popup-shell.js (see popup.html script order).
 */

/* global msg, $, relativeAgo, renderStatusBlock, renderChips, renderSkeleton, renderCtas */

const OPEN_WHOOP_URL = "https://app.whoop.com/";
const OPEN_EDITOR_URL = "https://kaiord.com/editor/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause: "Reading your WHOOP data through your open session.",
  connectedCauseAgo:
    "Reading your WHOOP data through your open session. Captured $1.",
  sessionSignedOut: "Session signed out",
  sessionSignedOutCause:
    "Your WHOOP tab is signed out, so nothing is reaching Kaiord right now.",
  captionFeeds: "Feeds Kaiord",
  captionMissing: "What Kaiord is missing",
  typeSleep: "Sleep",
  typeHrv: "HRV",
  typeStrain: "Strain",
  typeVitals: "Vitals",
  typeStress: "Stress",
  typeHeartRateSeries: "Heart Rate Series",
  typeActivity: "Activity",
  moreTypes: "+$1 more",
  minuteAgo: "$1 minute ago",
  minutesAgo: "$1 minutes ago",
  hourAgo: "$1 hour ago",
  hoursAgo: "$1 hours ago",
  dayAgo: "$1 day ago",
  daysAgo: "$1 days ago",
  openEditor: "Open Kaiord editor",
  signInWhoop: "Sign in to WHOOP",
  openWhoop: "Open WHOOP ↗",
  refresh: "Refresh",
};

// Managed data types this bridge imports, named exactly as the Connections
// page names them (@kaiord/core MANAGED_DATA_REGISTRY labels). Only the first
// CHIPS_SHOWN fit a 340px popup; the rest collapse into one "+N more" chip.
const FEED_KEYS = [
  "typeSleep",
  "typeHrv",
  "typeStrain",
  "typeVitals",
  "typeStress",
  "typeHeartRateSeries",
  "typeActivity",
];
const CHIPS_SHOWN = 4;

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const feedChips = (modifier) => {
  const chips = FEED_KEYS.slice(0, CHIPS_SHOWN).map((key) => ({
    label: msg(key),
    modifier,
  }));
  const rest = FEED_KEYS.length - CHIPS_SHOWN;
  if (rest > 0) {
    chips.push({ label: msg("moreTypes", [String(rest)]), modifier: "muted" });
  }
  return chips;
};

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

// The paused-chip box only exists in the signed-out state; its warning tint
// comes from `.chips-box`, applied to the region rather than the chips.
const setPausedBox = (visible) => {
  $("paused-region").className = visible ? "chips-box" : "";
};

const renderConnected = (capturedAt) => {
  const ago = capturedAt ? relativeAgo(capturedAt) : null;
  renderStatusBlock($, msg, {
    tone: "ok",
    verdictKey: "connected",
    causeKey: ago ? "connectedCauseAgo" : "connectedCause",
    causeSubs: ago ? [ago] : undefined,
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  setPausedBox(false);
  renderChips($, [], { region: "paused-region" });
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openWhoop"),
    secondaryHref: OPEN_WHOOP_URL,
  });
};

const renderSignedOut = () => {
  renderStatusBlock($, msg, {
    tone: "warn",
    verdictKey: "sessionSignedOut",
    causeKey: "sessionSignedOutCause",
  });
  renderChips($, []);
  setPausedBox(true);
  renderChips($, feedChips("muted"), {
    caption: msg("captionMissing"),
    region: "paused-region",
  });
  renderCtas($, {
    primaryLabel: msg("signInWhoop"),
    primaryHref: OPEN_WHOOP_URL,
    secondaryLabel: msg("openEditor"),
    secondaryHref: OPEN_EDITOR_URL,
  });
};

const refresh = async () => {
  showRefresh(false);
  renderStatusBlock($, msg, {
    tone: "muted",
    verdictKey: "checking",
    causeKey: "checkingCause",
  });
  renderSkeleton($);
  const res = await sendMessage({ action: "status" });
  const status = res.ok ? (res.data ?? {}) : {};
  if (status.connected) renderConnected(status.capturedAt);
  else renderSignedOut();
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  refresh();
});
