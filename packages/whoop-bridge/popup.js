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
 * arriving — instead of only reporting the failure, and once Kaiord has seen
 * the outage on an earlier open it also names the date its intake stopped.
 *
 * Three states, not two. A captured bearer is NOT the same as a readable
 * bridge: the token lives in chrome.storage.session and outlives the tab it
 * came from, while every read runs inside an app.whoop.com tab
 * (background.js whoopFetch → findWhoopTab). Reporting "Connected" with no
 * tab open would describe a bridge whose every read throws, so the popup asks
 * for both signals and names the middle state on its own terms.
 *
 * Only the signed-out state is folded into the health record. A held bearer
 * with no tab open is not an outage of the session — the bridge is one click
 * from reading again — so dating it would put an alarm on a state the user
 * resolves by opening a tab.
 *
 * Every consequence line below is a fact the code sustains: nothing in
 * src/application/whoop/** deletes an imported record, so what has already
 * arrived is kept; and the bearer is only ever captured on app.whoop.com, so
 * that is where a lost session is regained.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js and bridge-popup-health.js (see popup.html script
 * order).
 */

/* global msg, $, relativeAgo, formatSinceDate, recordProbe, renderStatusBlock,
   renderChips, renderConsequence, renderSkeleton, renderCtas */

const OPEN_WHOOP_URL = "https://app.whoop.com/";
const OPEN_EDITOR_URL = "https://kaiord.com/app/";

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
    "Kaiord is not holding a WHOOP session, so nothing is reaching it right now.",
  sessionExpired: "Session expired",
  sessionExpiredCause:
    "Kaiord stopped receiving WHOOP data on $1 and has held no session since.",
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
  reviewInKaiord: "Review in Kaiord ↗",
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

// Every region any resolved state fills. `paused-region` and `chips-region`
// are an either/or — a state uses one or the other — so the skeleton stands
// in the chips row and leaves the box region empty rather than reserving
// height for both at once.
const SKELETON_REGIONS = [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "consequence-region", parts: ["line", "line-short"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
];

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
    chips.push({ label: msg("moreTypes", [String(rest)]), modifier: "more" });
  }
  return chips;
};

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

const setMarkEstablished = (established) => {
  $("brand-mark").classList.toggle("popup-header__mark--muted", !established);
};

// The paused-chip box only exists in the interrupted states; its container
// comes from `.chips-box`, applied to the region rather than the chips.
const setPausedBox = (visible) => {
  $("paused-region").className = visible ? "chips-box" : "";
};

const renderConnected = (capturedAt) => {
  const ago = capturedAt ? relativeAgo(capturedAt) : null;
  setMarkEstablished(true);
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
   pointed at the other half of what a working bridge needs. The mark stays a
   dot: the session is intact, so this is not an outage to raise an alert on. */
const renderNoTab = () => {
  setMarkEstablished(true);
  renderStatusBlock($, msg, {
    tone: "muted",
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

/* The cause names Kaiord's own state, not the user's tab. This branch is
   reached on `!connected` whatever the tab is doing, and its commonest trigger
   is a browser restart emptying chrome.storage.session — after which there may
   be no WHOOP tab at all, or one still signed in. "Your WHOOP tab is signed
   out" was false in both. What `!connected` actually measures is that the
   bridge holds no bearer, so that is what the sentence says — and once an
   earlier open has already recorded the outage, from when. */
const renderSignedOut = (since) => {
  const dated = since !== null;
  setMarkEstablished(dated);
  renderStatusBlock($, msg, {
    tone: "warn",
    mark: dated ? "alert" : "dot",
    verdictKey: dated ? "sessionExpired" : "sessionSignedOut",
    causeKey: dated ? "sessionExpiredCause" : "sessionSignedOutCause",
    causeSubs: dated ? [formatSinceDate(since)] : undefined,
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
    secondaryLabel: msg("reviewInKaiord"),
    secondaryHref: OPEN_EDITOR_URL,
  });
};

const refresh = async () => {
  showRefresh(false);
  setMarkEstablished(false);
  renderStatusBlock($, msg, {
    tone: "checking",
    verdictKey: "checking",
    causeKey: "checkingCause",
  });
  renderSkeleton($, SKELETON_REGIONS);
  setPausedBox(false);
  renderChips($, [], { region: "paused-region" });
  const [statusRes, tabRes] = await Promise.all([
    sendMessage({ action: "status" }),
    sendMessage({ action: "tab-open" }),
  ]);
  const status = statusRes.ok ? (statusRes.data ?? {}) : {};
  // A failed tab probe is treated as "no tab": the read it stands for would
  // fail too, so the cautious state is also the accurate one.
  const tabOpen = tabRes.ok && tabRes.data?.open === true;
  // The health record tracks the SESSION, which is what `connected` reports.
  // A missing tab is not a lapsed session and must not clear or start an
  // outage, so the probe outcome folded in here is `status.connected` alone.
  const health = await recordProbe(!!status.connected);
  if (!status.connected) renderSignedOut(health.since);
  else if (!tabOpen) renderNoTab();
  else renderConnected(status.capturedAt);
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  refresh();
});
