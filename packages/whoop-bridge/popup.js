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
 * Three states, not two. A captured bearer is NOT the same as a readable
 * bridge: the token lives in chrome.storage.session and outlives the tab it
 * came from, while every read runs inside an app.whoop.com tab
 * (background.js whoopFetch → findWhoopTab). Reporting "Connected" with no
 * tab open would describe a bridge whose every read throws, so the popup asks
 * for both signals and names the middle state on its own terms.
 *
 * Every consequence line below is a fact the code sustains: nothing in
 * src/application/whoop/** deletes an imported record, so what has already
 * arrived is kept; and the bearer is only ever captured on app.whoop.com, so
 * that is where a lost session is regained.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js and
 * bridge-popup-shell.js (see popup.html script order).
 */

/* global msg, $, relativeAgo, renderStatusBlock, renderChips, renderConsequence, renderSkeleton, renderCtas */

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
  noTab: "No WHOOP tab open",
  noTabCause:
    "Your session is still held, but Kaiord reads WHOOP from inside an app.whoop.com tab.",
  keepsImported: "Everything already imported stays in Kaiord.",
  resumeOpenTab:
    "Open app.whoop.com and Kaiord reads from that tab again — nothing here is lost meanwhile.",
  resumeSignIn:
    "Sign in at app.whoop.com and leave the tab open; the bridge picks the session back up on its own.",
  readsNeedTab:
    "Kaiord reads through that open tab. Close every app.whoop.com tab and reads stop until you open one again.",
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
  renderConsequence($, [msg("readsNeedTab")]);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openWhoop"),
    secondaryHref: OPEN_WHOOP_URL,
  });
};

/* Bearer held, no tab to run the read in. The fix is opening WHOOP, so that
   is the primary CTA — the same fix-first rule the signed-out state follows,
   pointed at the other half of what a working bridge needs. */
const renderNoTab = () => {
  renderStatusBlock($, msg, {
    tone: "warn",
    verdictKey: "noTab",
    causeKey: "noTabCause",
  });
  renderChips($, []);
  setPausedBox(true);
  renderChips($, feedChips("muted"), {
    caption: msg("captionMissing"),
    region: "paused-region",
  });
  renderConsequence($, [msg("keepsImported"), msg("resumeOpenTab")]);
  renderCtas($, {
    primaryLabel: msg("openWhoop"),
    primaryHref: OPEN_WHOOP_URL,
    secondaryLabel: msg("openEditor"),
    secondaryHref: OPEN_EDITOR_URL,
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
  renderConsequence($, [msg("keepsImported"), msg("resumeSignIn")]);
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
  renderConsequence($, []);
  const [statusRes, tabRes] = await Promise.all([
    sendMessage({ action: "status" }),
    sendMessage({ action: "tab-open" }),
  ]);
  const status = statusRes.ok ? (statusRes.data ?? {}) : {};
  // A failed tab probe is treated as "no tab": the read it stands for would
  // fail too, so the cautious state is also the accurate one.
  const tabOpen = tabRes.ok && tabRes.data?.open === true;
  if (!status.connected) renderSignedOut();
  else if (!tabOpen) renderNoTab();
  else renderConnected(status.capturedAt);
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  refresh();
});
