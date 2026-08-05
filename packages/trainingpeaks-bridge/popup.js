/**
 * Kaiord TrainingPeaks Bridge — Popup
 *
 * Session-status only: it reports whether the user's TrainingPeaks session can
 * mint an access token. There is no credential entry — the bridge rides the
 * user's own logged-in session cookie. All logic talks to background.js via
 * internal runtime messages.
 *
 * The primary CTA is whatever fixes the current state: going to TrainingPeaks
 * when the session is missing, opening the Kaiord editor when the metrics API
 * is reachable.
 *
 * Two shapes of "not signed in", told apart by the stored health record: a
 * bridge never observed working is still being set up, while one that worked
 * and stopped is an outage and says since when.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js and bridge-popup-health.js (see popup.html script
 * order).
 */

/* global msg, $, formatSinceDate, recordProbe, renderStatusBlock, renderChips,
   renderConsequence, renderSkeleton, renderCtas */

const OPEN_TRAININGPEAKS_URL = "https://app.trainingpeaks.com/";
const OPEN_EDITOR_URL = "https://kaiord.com/editor/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause: "Reading your body metrics through your session.",
  notSignedIn: "Not signed in",
  notSignedInCause:
    "Sign in at trainingpeaks.com once — the bridge mints its token from that session, no password stored.",
  sessionEnded: "Session ended",
  sessionEndedCause:
    "Nothing has reached Kaiord since $1. Sign in at trainingpeaks.com again and the bridge mints a fresh token.",
  captionFeeds: "Feeds Kaiord",
  captionWillFeed: "Will feed Kaiord",
  typeWeight: "Weight",
  typeWeightBack: "Weight ↑ back to TrainingPeaks",
  weightManualFallback: "Weight currently comes from manual entry.",
  openEditor: "Open Kaiord editor",
  openTrainingPeaksPrimary: "Open TrainingPeaks",
  setUpInKaiord: "Set up in Kaiord ↗",
  openTrainingPeaks: "Open TrainingPeaks ↗",
  refresh: "Refresh",
};

// Managed data types this bridge moves, named exactly as the Connections page
// names them (@kaiord/core MANAGED_DATA_REGISTRY labels).
//
// FEED_KEYS is what actually flows today: `read-metrics` imports weight.
// FUTURE_KEYS is capability the bridge exposes but nothing drives yet — the
// `push-weight` action exists here, while the SPA ships no export route for
// this bridge. Listing it under "Feeds Kaiord" would be manifest-true and
// user-false, so it gets its own dashed row: the same register the
// not-signed-in state uses for "this would work once it is wired".
const FEED_KEYS = ["typeWeight"];
const FUTURE_KEYS = ["typeWeightBack"];

// Every region any resolved state fills, so the checking layout is the
// resolved layout's height.
const SKELETON_REGIONS = [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "future-region", parts: ["caption", "chips"] },
  { region: "consequence-region", parts: ["line"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
];

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const chipsFor = (keys, modifier) =>
  keys.map((key) => ({ label: msg(key), modifier }));

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

const setMarkEstablished = (established) => {
  $("brand-mark").classList.toggle("popup-header__mark--muted", !established);
};

const renderConnected = () => {
  setMarkEstablished(true);
  renderStatusBlock($, msg, {
    tone: "ok",
    verdictKey: "connected",
    causeKey: "connectedCause",
  });
  renderChips($, chipsFor(FEED_KEYS), { caption: msg("captionFeeds") });
  renderChips($, chipsFor(FUTURE_KEYS, "dashed"), {
    caption: msg("captionWillFeed"),
    region: "future-region",
  });
  renderConsequence($, []);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openTrainingPeaks"),
    secondaryHref: OPEN_TRAININGPEAKS_URL,
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
  // Nothing flows in either direction yet, so one dashed row covers both.
  renderChips($, chipsFor([...FEED_KEYS, ...FUTURE_KEYS], "dashed"), {
    caption: msg("captionWillFeed"),
  });
  renderChips($, [], { region: "future-region" });
  renderConsequence($, [msg("weightManualFallback")]);
  renderCtas($, {
    primaryLabel: msg("openTrainingPeaksPrimary"),
    primaryHref: OPEN_TRAININGPEAKS_URL,
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
