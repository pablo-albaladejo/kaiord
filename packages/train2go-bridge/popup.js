/**
 * Kaiord Train2Go Bridge — Popup
 *
 * Shell layout: status block (verdict + coach line), capability chips,
 * athlete card from cached profile-snapshot, weekly figures
 * (planned / done / workload) over a completion bar with a 5-minute
 * `lastWeeklyRollup` TTL cache, collapsible coach notes, CTA pair.
 * Auto-fetches on open with bounded per-phase timeouts (snapshot 1 s, ping
 * 3 s, rollup 8 s). Retry only appears on user-resolvable failures;
 * rollup-only timeout preserves the connected state.
 *
 * The primary CTA is whatever fixes the current state: logging back in at
 * Train2Go when the session is gone, opening the Kaiord editor when the plan
 * is flowing.
 *
 * Only the session verdict is folded into the health record. A background
 * worker that did not answer is inconclusive — it says nothing about whether
 * the Train2Go session is alive — so it neither starts nor clears an outage.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js, bridge-popup-health.js and bridge-popup-snapshot.js
 * (see popup.html script order).
 */

/* global msg, $, withTimeout, formatSinceDate, recordProbe, renderRetry,
   renderStatusBlock, renderChips, renderSkeleton, renderCtas,
   renderAthleteCard */

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const ROLLUP_TIMEOUT_MS = 8_000;
const ROLLUP_TTL_MS = 5 * 60 * 1_000;

const OPEN_EDITOR_URL = "https://kaiord.com/editor/";
const OPEN_TRAIN2GO_URL = "https://app.train2go.com/user/index";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedAs: "Connected as $1",
  coachSub: "Coach · $1",
  sessionSignedOut: "Session signed out",
  sessionSignedOutCause:
    "Your Train2Go tab is logged out, so no new plan is reaching Kaiord.",
  sessionExpired: "Session expired",
  sessionExpiredCause:
    "No new plan has reached Kaiord since $1. Logging back in at Train2Go starts it again.",
  bridgeNotResponding: "Bridge not responding",
  bridgeNotRespondingCause:
    "The extension's background worker did not answer. Try again.",
  captionFeeds: "Feeds Kaiord",
  typePlannedSession: "Planned Session",
  typeTrainingZones: "Training Zones",
  profileStale: "Profile snapshot is stale. Open Kaiord to refresh.",
  noProfile: "No profile yet. Open Kaiord to set FTP, pace, and HR.",
  noThresholds:
    "Profile has no thresholds yet. Open Kaiord to set FTP, pace, and HR.",
  labelSport: "Sport",
  labelPace: "Pace",
  labelMaxHr: "Max HR",
  labelWeight: "Weight",
  captionThisWeek: "This week",
  weekPlanned: "planned",
  weekDone: "done",
  weekWorkload: "workload",
  rollupUnavailable: "Rollup unavailable — try again",
  coachNotes: "Coach notes",
  updatedAgo: "Updated $1",
  updatedJustNow: "Updated just now",
  minuteAgo: "$1 minute ago",
  minutesAgo: "$1 minutes ago",
  hourAgo: "$1 hour ago",
  hoursAgo: "$1 hours ago",
  dayAgo: "$1 day ago",
  daysAgo: "$1 days ago",
  openEditor: "Open Kaiord editor",
  signInTrain2go: "Log in to Train2Go",
  openTrain2go: "Open Train2Go ↗",
  retry: "Retry",
  refresh: "Refresh",
};

// Managed data types this bridge imports, named exactly as the Connections
// page names them (@kaiord/core MANAGED_DATA_REGISTRY labels).
const FEED_KEYS = ["typePlannedSession", "typeTrainingZones"];

// Every region any resolved state fills, so the checking layout is the
// resolved layout's height.
const SKELETON_REGIONS = [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "athlete-region", parts: ["block"] },
  { region: "week-region", parts: ["caption", "block-sm"] },
  { region: "notes-region", parts: ["block-sm"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
];

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const readStorage = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["profileSnapshot", "lastWeeklyRollup"], (rs) =>
      resolve(rs ?? {})
    );
  });

const writeRollup = (rollup) =>
  new Promise((resolve) => {
    chrome.storage.local.set(
      { lastWeeklyRollup: { ...rollup, cachedAt: Date.now() } },
      resolve
    );
  });

const todayISO = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const isFreshRollup = (rollup) =>
  Boolean(rollup?.cachedAt && Date.now() - rollup.cachedAt < ROLLUP_TTL_MS);

const summariseRollup = (activities) => {
  let planned = 0;
  let done = 0;
  let workload = 0;
  for (const a of activities ?? []) {
    planned += 1;
    if (a.status === 1) done += 1;
    if (typeof a.workload === "number") workload += a.workload;
  }
  return { planned, done, workload };
};

const feedChips = (modifier) =>
  FEED_KEYS.map((key) => ({ label: msg(key), modifier }));

const rollupCaption = (region) => {
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = msg("captionThisWeek");
  region.appendChild(caption);
};

// One figure of the weekly row: the number carries the weight, the word
// underneath it stays small. Three of these read at a glance where the old
// single sentence had to be parsed.
const weekFigure = (value, labelKey) => {
  const figure = document.createElement("div");
  figure.className = "week__figure";
  const num = document.createElement("span");
  num.className = "week__value";
  num.textContent = String(value);
  const label = document.createElement("span");
  label.className = "week__label";
  label.textContent = msg(labelKey);
  figure.append(num, label);
  return figure;
};

const renderRollup = (rollup) => {
  const region = $("week-region");
  region.innerHTML = "";
  if (!rollup) return;
  rollupCaption(region);
  const week = document.createElement("div");
  week.className = "week";
  const figures = document.createElement("div");
  figures.className = "week__figures";
  figures.append(
    weekFigure(rollup.planned, "weekPlanned"),
    weekFigure(rollup.done, "weekDone"),
    weekFigure(rollup.workload, "weekWorkload")
  );
  const bar = document.createElement("div");
  bar.className = "week__bar";
  const fill = document.createElement("span");
  fill.className = "week__bar-fill";
  const pct = rollup.planned > 0 ? (rollup.done / rollup.planned) * 100 : 0;
  fill.style.width = `${Math.round(pct)}%`;
  bar.appendChild(fill);
  week.append(figures, bar);
  region.appendChild(week);
};

const renderRollupUnavailable = () => {
  const region = $("week-region");
  region.innerHTML = "";
  rollupCaption(region);
  const el = document.createElement("div");
  el.className = "rollup rollup--unavailable";
  el.textContent = msg("rollupUnavailable");
  region.appendChild(el);
};

// Render the trainer's free-text notes about the trainee inside a
// collapsible <details> box. The body is set via textContent — never
// innerHTML — so HTML in the upstream payload cannot inject markup.
// `parsePingJson` already strips tags upstream; this is defense in
// depth.
const renderNotes = (notes) => {
  const region = $("notes-region");
  region.innerHTML = "";
  if (typeof notes !== "string" || notes.length === 0) return;

  const details = document.createElement("details");
  details.className = "notes";

  const summary = document.createElement("summary");
  summary.className = "notes__summary";
  summary.textContent = msg("coachNotes");
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "notes__body";
  body.textContent = notes;
  details.appendChild(body);

  region.appendChild(details);
};

const showRefresh = (visible) => {
  $("refresh-btn").classList.toggle("popup-header__refresh--hidden", !visible);
};

const setMarkEstablished = (established) => {
  $("brand-mark").classList.toggle("popup-header__mark--muted", !established);
};

// Any non-connected state pauses the plan feed, so the chips go muted and the
// primary CTA becomes the fix rather than the editor link. `since` is null for
// a state the health record cannot date — including every worker timeout,
// which is inconclusive about the session rather than evidence against it.
const renderBroken = ({ verdictKey, causeKey, causeSubs, mark = "dot" }) => {
  renderStatusBlock($, msg, {
    tone: "warn",
    mark,
    verdictKey,
    causeKey,
    causeSubs,
  });
  renderChips($, feedChips("muted"), { caption: msg("captionFeeds") });
  renderCtas($, {
    primaryLabel: msg("signInTrain2go"),
    primaryHref: OPEN_TRAIN2GO_URL,
    secondaryLabel: msg("openEditor"),
    secondaryHref: OPEN_EDITOR_URL,
  });
  renderRetry(() => loadPopupData());
};

const renderSignedOut = (since) => {
  const dated = since !== null;
  setMarkEstablished(dated);
  renderBroken({
    mark: dated ? "alert" : "dot",
    verdictKey: dated ? "sessionExpired" : "sessionSignedOut",
    causeKey: dated ? "sessionExpiredCause" : "sessionSignedOutCause",
    causeSubs: dated ? [formatSinceDate(since)] : undefined,
  });
};

const fetchRollup = async (userId, bypassTtl) => {
  const storage = await readStorage();
  if (!bypassTtl && isFreshRollup(storage.lastWeeklyRollup)) {
    return storage.lastWeeklyRollup;
  }
  const res = await sendMessage({
    action: "read-week",
    date: todayISO(),
    userId,
  });
  if (!res?.ok) throw new Error(res?.error ?? "read-week failed");
  const summary = summariseRollup(res.data?.activities);
  await writeRollup(summary);
  return summary;
};

const renderConnected = ({ userName, coachName }) => {
  setMarkEstablished(true);
  renderStatusBlock($, msg, {
    tone: "ok",
    verdictKey: userName ? "connectedAs" : "connected",
    verdictSubs: userName ? [userName] : undefined,
    causeKey: coachName ? "coachSub" : undefined,
    causeSubs: coachName ? [coachName] : undefined,
  });
  renderChips($, feedChips(), { caption: msg("captionFeeds") });
  renderCtas($, {
    primaryLabel: msg("openEditor"),
    primaryHref: OPEN_EDITOR_URL,
    secondaryLabel: msg("openTrain2go"),
    secondaryHref: OPEN_TRAIN2GO_URL,
  });
};

const loadPopupData = async ({ bypassTtl = false } = {}) => {
  showRefresh(false);
  setMarkEstablished(false);
  renderStatusBlock($, msg, {
    tone: "checking",
    verdictKey: "checking",
    causeKey: "checkingCause",
  });
  renderSkeleton($, SKELETON_REGIONS);

  let storage;
  try {
    storage = await withTimeout(readStorage(), SNAPSHOT_TIMEOUT_MS, "snapshot");
  } catch {
    renderAthleteCard(undefined);
    renderBroken({
      verdictKey: "bridgeNotResponding",
      causeKey: "bridgeNotRespondingCause",
    });
    return;
  }

  let ping;
  try {
    ping = await withTimeout(
      sendMessage({ action: "ping" }),
      PHASE_TIMEOUT_MS,
      "ping"
    );
  } catch {
    renderAthleteCard(storage.profileSnapshot);
    renderBroken({
      verdictKey: "bridgeNotResponding",
      causeKey: "bridgeNotRespondingCause",
    });
    return;
  }

  const sessionActive = Boolean(ping?.ok && ping?.data?.sessionActive);
  const health = await recordProbe(sessionActive);
  if (!sessionActive) {
    renderAthleteCard(storage.profileSnapshot);
    renderSignedOut(health.since);
    return;
  }

  renderConnected(ping.data);
  renderAthleteCard(storage.profileSnapshot);
  renderNotes(ping.data.notes);

  // Rollup phase — failure here keeps the connected state.
  const userId = ping.data.userId;
  if (typeof userId === "number") {
    try {
      const rollup = await withTimeout(
        fetchRollup(userId, bypassTtl),
        ROLLUP_TIMEOUT_MS,
        "rollup"
      );
      renderRollup(rollup);
    } catch {
      renderRollupUnavailable();
    }
  }

  showRefresh(true);
};

$("refresh-btn").addEventListener("click", () =>
  loadPopupData({ bypassTtl: true })
);

window.addEventListener("DOMContentLoaded", () => {
  $("refresh-btn").setAttribute("aria-label", msg("refresh"));
  loadPopupData();
});
