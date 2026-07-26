/**
 * Kaiord Tanita Bridge — Popup
 *
 * Session-status only: it reports whether the user's mytanita.eu session can
 * reach the CSV export. There is no credential entry — the bridge rides the
 * user's own logged-in session. All logic talks to background.js via internal
 * runtime messages.
 *
 * The primary CTA is whatever fixes the current state: signing in at
 * MyTANITA when the session is missing, opening the Kaiord editor when the
 * export is reachable.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js and
 * bridge-popup-shell.js (see popup.html script order).
 */

/* global msg, $, renderStatusBlock, renderChips, renderSkeleton, renderCtas */

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
  captionFeeds: "Feeds Kaiord",
  captionWillFeed: "Will feed Kaiord",
  typeWeight: "Weight",
  typeBodyComposition: "Body Composition",
  openEditor: "Open Kaiord editor",
  signInTanita: "Sign in to MyTANITA",
  openTanita: "Open MyTANITA ↗",
  refresh: "Refresh",
};

// Managed data types this bridge imports, named exactly as the Connections
// page names them (@kaiord/core MANAGED_DATA_REGISTRY labels).
const FEED_KEYS = ["typeWeight", "typeBodyComposition"];

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

const renderConnected = () => {
  renderStatusBlock($, msg, {
    tone: "ok",
    verdictKey: "connected",
    causeKey: "connectedCause",
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openTanita"),
    secondaryHref: OPEN_TANITA_URL,
  });
};

const renderNotSignedIn = () => {
  renderStatusBlock($, msg, {
    tone: "muted",
    verdictKey: "notSignedIn",
    causeKey: "notSignedInCause",
  });
  renderChips($, feedChips("dashed"), { caption: msg("captionWillFeed") });
  renderCtas($, {
    primaryLabel: msg("signInTanita"),
    primaryHref: OPEN_TANITA_URL,
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
