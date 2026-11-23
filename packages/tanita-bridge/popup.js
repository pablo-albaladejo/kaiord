/**
 * Kaiord Tanita Bridge — Popup
 *
 * Session-status only: it reports whether the user's mytanita.eu session can
 * reach the CSV export. There is no credential entry — the bridge rides the
 * user's own logged-in session. All logic talks to background.js via internal
 * runtime messages.
 *
 * A working Connection opens the Kaiord editor. Anything else shows one
 * notice with one fix, worded by the vendored connection-notices.js — the
 * same wording the Kaiord App shows. A bridge never observed working gets the
 * dot and no date; one that HAS worked and stopped gets the alert icon and
 * the date Kaiord first saw the check fail.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js and bridge-popup-health.js (see popup.html script
 * order).
 */

/* global msg, $, uiLocale, localizePage, formatSinceDate, recordProbe, renderStatusBlock, renderChips,
   renderConsequence, renderSkeleton, renderCtas, renderBrokenConnection,
   KAIORD_CONNECTION_NOTICES */

const OPEN_TANITA_URL = "https://mytanita.eu/en/user";
const OPEN_EDITOR_URL = "https://kaiord.com/app/";
// The Platform's name exactly as the Kaiord App's registry spells it, so a
// notice reads the same in both (scripts/check-connection-notices.mjs).
const PLATFORM = "Tanita";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  extName: "Kaiord for Tanita",
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause: "Reading your body-composition export through your session.",
  outageSince: "Since $1.",
  captionFeeds: "Feeds Kaiord",
  captionWillFeed: "Will feed Kaiord",
  typeWeight: "Weight",
  typeBodyComposition: "Body Composition",
  openEditor: "Open Kaiord editor",
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

// The monogram dims until the bridge's identity is established: a source
// that has never signed in reads as provisional, one that is connected or
// interrupted reads as known.
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
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  renderConsequence($, []);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openTanita"),
    secondaryHref: OPEN_TANITA_URL,
  });
};

// The Connection's state from this popup's own check: the typed `session`
// outcome, where only "signed-out" is MyTANITA's own refusal. An older
// extension's `authenticated: false` cannot tell a refusal from an outage.
const TYPED_STATE = {
  "signed-in": "working",
  "signed-out": "signed-out",
  "not-answering": "not-answering",
};

const connectionStateOf = (res) => {
  const typed = res.ok ? TYPED_STATE[res.data?.session] : undefined;
  if (typed) return typed;
  if (res.ok && res.data?.authenticated) return "working";
  return "not-answering";
};

/* One notice, one fix. `since` is the outage start Kaiord already knew about,
   or null when this is the first probe that ever failed; only then may the
   notice carry a date. */
const renderBroken = (state, since) => {
  renderBrokenConnection(
    $,
    msg,
    KAIORD_CONNECTION_NOTICES.noticeFor(state, PLATFORM, uiLocale()),
    {
      since,
      href: OPEN_TANITA_URL,
      onRetry: () => refresh(),
      formatSince: formatSinceDate,
    }
  );
  renderChips($, []);
  renderConsequence($, []);
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
  const state = connectionStateOf(res);
  const health = await recordProbe(state === "working");
  if (state === "working") renderConnected();
  else renderBroken(state, health.since);
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  localizePage();
  refresh();
});
