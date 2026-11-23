/**
 * Kaiord TrainingPeaks Bridge — Popup
 *
 * Session-status only: it reports whether the user's TrainingPeaks session can
 * mint an access token. There is no credential entry — the bridge rides the
 * user's own logged-in session cookie. All logic talks to background.js via
 * internal runtime messages.
 *
 * A working Connection opens the Kaiord editor. Anything else shows one
 * notice with one fix, worded by the vendored connection-notices.js — the
 * same wording the Kaiord App shows — and, once an earlier open recorded the
 * outage in the health record, since when.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js and bridge-popup-health.js (see popup.html script
 * order).
 */

/* global msg, $, formatSinceDate, recordProbe, renderStatusBlock, renderChips,
   renderConsequence, renderSkeleton, renderCtas, renderNotice,
   KAIORD_CONNECTION_NOTICES */

const OPEN_TRAININGPEAKS_URL = "https://app.trainingpeaks.com/";
const OPEN_EDITOR_URL = "https://kaiord.com/app/";
// The Platform's name exactly as the Kaiord App's registry spells it, so a
// notice reads the same in both (scripts/check-connection-notices.mjs).
const PLATFORM = "TrainingPeaks";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause: "Reading your body metrics through your session.",
  outageSince: "Since $1.",
  captionFeeds: "Feeds Kaiord",
  captionWillFeed: "Will feed Kaiord",
  typeWeight: "Weight",
  typeWeightBack: "Weight ↑ back to TrainingPeaks",
  openEditor: "Open Kaiord editor",
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

// The Connection's state from this popup's own check. When it is not, `needsReauth` says
// whether the Platform refused the sign-in or merely failed to answer.
const connectionStateOf = (res) => {
  if (res.ok && res.data?.authenticated) return "working";
  if (res.ok && res.data?.needsReauth === true) return "signed-out";
  return "not-answering";
};

/* One notice, one fix. `since` is the outage start Kaiord already knew about,
   or null when this is the first probe that ever failed; only then may the
   notice carry a date. */
const renderBroken = (state, since) => {
  const notice = KAIORD_CONNECTION_NOTICES.noticeFor(
    state,
    PLATFORM,
    KAIORD_CONNECTION_NOTICES.EXTENSION_LOCALE
  );
  setMarkEstablished(since !== null);
  renderNotice($, notice, {
    since: since === null ? null : msg("outageSince", [formatSinceDate(since)]),
    href: OPEN_TRAININGPEAKS_URL,
    onRetry: () => refresh(),
  });
  renderChips($, []);
  renderChips($, [], { region: "future-region" });
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
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  refresh();
});
