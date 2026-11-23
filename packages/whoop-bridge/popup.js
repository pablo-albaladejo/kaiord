/**
 * Kaiord WHOOP Bridge — Popup
 *
 * Session-piggyback status: it reports whether a WHOOP session bearer has been
 * captured. There is no credential entry and no OAuth flow — the bridge rides
 * the user's own session. All logic talks to background.js via internal
 * runtime messages.
 *
 * A Connection that does not work shows one notice with one fix, worded by
 * the vendored connection-notices.js — the same wording the Kaiord App shows
 * — and, once an earlier open recorded the outage, since when.
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

/* global msg, $, uiLocale, localizePage, relativeAgo, formatSinceDate, recordProbe, renderStatusBlock,
   renderChips, renderConsequence, renderSkeleton, renderCtas, renderNotice,
   KAIORD_CONNECTION_NOTICES */

const OPEN_WHOOP_URL = "https://app.whoop.com/";
const OPEN_EDITOR_URL = "https://kaiord.com/app/";
// The Platform's name exactly as the Kaiord App's registry spells it, so a
// notice reads the same in both (scripts/check-connection-notices.mjs).
const PLATFORM = "WHOOP";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  extName: "Kaiord for WHOOP",
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedCause: "Reading your WHOOP data through your open session.",
  connectedCauseAgo:
    "Reading your WHOOP data through your open session. Captured $1.",
  outageSince: "Since $1.",
  notChecked: "Not checked yet",
  notCheckedCause:
    "Kaiord learns whether WHOOP works the first time an app.whoop.com tab sends a request.",
  keepsImported: "Everything already imported stays in Kaiord.",
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

/* Bearer held, no tab to run the read in: the shared no-tab notice, whose
   one fix is opening WHOOP. The mark stays a dot: the session is intact, so
   this is not an outage to raise an alert on. */
const renderNoTab = () => {
  setMarkEstablished(true);
  renderNotice($, KAIORD_CONNECTION_NOTICES.noTabNotice(PLATFORM, uiLocale()), {
    href: OPEN_WHOOP_URL,
  });
  renderChips($, []);
  setPausedBox(true);
  renderChips($, feedChips("muted"), {
    caption: msg("captionMissing"),
    region: "paused-region",
  });
  renderConsequence($, [msg("keepsImported")]);
};

/* A held bearer with no `custom:user_id`: every import path is built on that
   id, so nothing can be read. One notice, the sign-in fix. */
const renderNoAccountId = (since) => {
  setMarkEstablished(since !== null);
  renderNotice(
    $,
    KAIORD_CONNECTION_NOTICES.noticeForReason(
      "no-account-id",
      PLATFORM,
      uiLocale()
    ),
    {
      since:
        since === null ? null : msg("outageSince", [formatSinceDate(since)]),
      href: OPEN_WHOOP_URL,
    }
  );
  renderChips($, []);
  setPausedBox(false);
  renderChips($, [], { region: "paused-region" });
  renderConsequence($, [msg("keepsImported")]);
};

// The Connection's state, read as the Session check answers the Kaiord App:
// a held bearer is "signed-in", none captured yet is "not-checked" (no WHOOP
// request has passed since the worker started), never signed out. A worker
// that did not answer is "not-answering".
const connectionStateOf = (statusRes) => {
  if (!statusRes.ok) return "not-answering";
  return statusRes.data?.connected ? "working" : "not-checked";
};

/* Nothing captured yet: nothing was learned, so no notice, no outage. */
const renderNotChecked = () => {
  setMarkEstablished(false);
  renderStatusBlock($, msg, {
    tone: "muted",
    mark: "dot",
    verdictKey: "notChecked",
    causeKey: "notCheckedCause",
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  setPausedBox(false);
  renderChips($, [], { region: "paused-region" });
  renderConsequence($, []);
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openWhoop"),
    secondaryHref: OPEN_WHOOP_URL,
  });
};

/* One notice, one fix. A held bearer with no tab open is not this branch:
   the sign-in is intact, so renderNoTab says what the bridge needs instead. */
const renderBroken = (state, since) => {
  const notice = KAIORD_CONNECTION_NOTICES.noticeFor(
    state,
    PLATFORM,
    uiLocale()
  );
  setMarkEstablished(since !== null);
  renderNotice($, notice, {
    since: since === null ? null : msg("outageSince", [formatSinceDate(since)]),
    href: OPEN_WHOOP_URL,
    onRetry: () => refresh(),
  });
  renderChips($, []);
  setPausedBox(false);
  renderChips($, [], { region: "paused-region" });
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
  setPausedBox(false);
  renderChips($, [], { region: "paused-region" });
  const [statusRes, tabRes] = await Promise.all([
    sendMessage({ action: "popup-status" }),
    sendMessage({ action: "tab-open" }),
  ]);
  const state = connectionStateOf(statusRes);
  // A failed tab probe is treated as "no tab": the read it stands for would
  // fail too, so the cautious state is also the accurate one.
  const tabOpen = tabRes.ok && tabRes.data?.open === true;
  // The health record tracks the SESSION. A worker that did not answer says
  // nothing about it, and a missing tab is not a lapsed session, so neither
  // starts nor clears an outage.
  // A bearer without an account id is held but serves no import.
  const usable = state === "working" && statusRes.data.userId != null;
  if (state === "not-answering") renderBroken(state, null);
  else if (state === "not-checked") renderNotChecked();
  else {
    const health = await recordProbe(usable);
    if (state !== "working") renderBroken(state, health.since);
    else if (!usable) renderNoAccountId(health.since);
    else if (!tabOpen) renderNoTab();
    else renderConnected(statusRes.data.capturedAt);
  }
  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () => refresh());

window.addEventListener("DOMContentLoaded", () => {
  localizePage();
  refresh();
});
