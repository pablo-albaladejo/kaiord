/**
 * Kaiord TrainingPeaks Bridge — Popup
 *
 * Session-status only: it reports whether the user's TrainingPeaks session can
 * mint an access token. There is no credential entry — the bridge rides the
 * user's own logged-in session cookie. All logic talks to background.js via
 * internal runtime messages.
 *
 * The primary CTA is whatever fixes the current state: signing in at
 * TrainingPeaks when the session is missing, opening the Kaiord editor when
 * the metrics API is reachable.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js and
 * bridge-popup-shell.js (see popup.html script order).
 */

/* global msg, $, renderStatusBlock, renderChips, renderSkeleton, renderCtas */

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
  captionFeeds: "Feeds Kaiord",
  captionWillFeed: "Will feed Kaiord",
  typeWeight: "Weight",
  typeWeightBack: "Weight ↑ back to TrainingPeaks",
  openEditor: "Open Kaiord editor",
  signInTrainingPeaks: "Sign in to TrainingPeaks",
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

const renderConnected = () => {
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
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openTrainingPeaks"),
    secondaryHref: OPEN_TRAININGPEAKS_URL,
  });
};

const renderNotSignedIn = () => {
  renderStatusBlock($, msg, {
    tone: "muted",
    verdictKey: "notSignedIn",
    causeKey: "notSignedInCause",
  });
  // Nothing flows in either direction yet, so one dashed row covers both.
  renderChips($, chipsFor([...FEED_KEYS, ...FUTURE_KEYS], "dashed"), {
    caption: msg("captionWillFeed"),
  });
  renderChips($, [], { region: "future-region" });
  renderCtas($, {
    primaryLabel: msg("signInTrainingPeaks"),
    primaryHref: OPEN_TRAININGPEAKS_URL,
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
  // renderSkeleton owns chips + footer only; drop a stale future row so a
  // re-check never shows last cycle's content next to a fresh skeleton.
  renderChips($, [], { region: "future-region" });
  const res = await sendMessage({ action: "checkSession" });
  const authenticated = res.ok ? !!res.data?.authenticated : false;
  if (authenticated) renderConnected();
  else renderNotSignedIn();
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  refresh();
});
