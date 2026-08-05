/**
 * Kaiord Tanita Bridge — Popup
 *
 * Session-status only: it reports whether the user's mytanita.eu session can
 * reach the CSV export. There is no credential entry — the bridge rides the
 * user's own logged-in session. All logic talks to background.js via internal
 * runtime messages.
 *
 * The primary CTA is whatever fixes the current state: going to MyTANITA when
 * the session is missing, opening the Kaiord editor when the export is
 * reachable.
 *
 * Two shapes of "not signed in", told apart by the stored health record. A
 * bridge that has never been observed working gets the dot and the dateless
 * invitation; one that HAS worked and stopped gets the alert icon and the date
 * Kaiord last heard from it, because that is an outage rather than a setup
 * step still pending.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js and bridge-popup-health.js (see popup.html script
 * order).
 */

/* global msg, $, formatSinceDate, recordProbe, renderStatusBlock, renderChips,
   renderConsequence, renderSkeleton, renderCtas */

const OPEN_TANITA_URL = "https://mytanita.eu/en/user";
const OPEN_EDITOR_URL = "https://kaiord.com/editor/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause: "Reading your body-composition export through your session.",
  notSignedIn: "Not signed in",
  notSignedInCause:
    "Sign in at mytanita.eu once — the bridge reads your export from that session, no password stored.",
  sessionEnded: "Session ended",
  sessionEndedCause:
    "Nothing has reached Kaiord since $1. Sign in at mytanita.eu again and the bridge picks your export back up.",
  captionFeeds: "Feeds Kaiord",
  captionWillFeed: "Will feed Kaiord",
  typeWeight: "Weight",
  typeBodyComposition: "Body Composition",
  manualFallback: "Both currently come from manual entry.",
  openEditor: "Open Kaiord editor",
  openTanitaPrimary: "Open MyTANITA",
  setUpInKaiord: "Set up in Kaiord ↗",
  openTanita: "Open MyTANITA ↗",
  refresh: "Refresh",
};

// Managed data types this bridge imports, named exactly as the Connections
// page names them (@kaiord/core MANAGED_DATA_REGISTRY labels).
const FEED_KEYS = ["typeWeight", "typeBodyComposition"];

// Every region any resolved state fills, so the checking layout is the
// resolved layout's height. Naming fewer would reintroduce the jump.
const SKELETON_REGIONS = [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "consequence-region", parts: ["line"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
];

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const feedChips = (modifier) =>
  FEED_KEYS.map((key) => ({ label: msg(key), modifier }));

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

// The monogram dims until the bridge's identity is established, which is the
// same rule the V2 screen draws: a source that has never signed in reads as
// provisional, one that is connected or interrupted reads as known.
const setMarkEstablished = (established) => {
  $("brand-mark").classList.toggle(
    "popup-header__mark--muted",
    !established
  );
};

const renderConnected = () => {
  setMarkEstablished(true);
  renderStatusBlock($, msg, {
    tone: "ok",
    verdictKey: "connected",
    causeKey: "connectedCause",
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  renderConsequence($, []);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openTanita"),
    secondaryHref: OPEN_TANITA_URL,
  });
};

/* `since` is the outage start Kaiord already knew about, or null when this is
   the first probe that ever failed. Only the first case may name a date. */
const renderNotSignedIn = (since) => {
  const dated = since !== null;
  setMarkEstablished(dated);
  renderStatusBlock($, msg, {
    tone: dated ? "warn" : "muted",
    mark: dated ? "alert" : "dot",
    verdictKey: dated ? "sessionEnded" : "notSignedIn",
    causeKey: dated ? "sessionEndedCause" : "notSignedInCause",
    causeSubs: dated ? [formatSinceDate(since)] : undefined,
  });
  renderChips($, feedChips("dashed"), { caption: msg("captionWillFeed") });
  renderConsequence($, [msg("manualFallback")]);
  renderCtas($, {
    primaryLabel: msg("openTanitaPrimary"),
    primaryHref: OPEN_TANITA_URL,
    secondaryLabel: msg("setUpInKaiord"),
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
  const res = await sendMessage({ action: "checkSession" });
  const authenticated = res.ok ? !!res.data?.authenticated : false;
  const health = await recordProbe(authenticated);
  if (authenticated) renderConnected();
  else renderNotSignedIn(health.since);
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  refresh();
});
