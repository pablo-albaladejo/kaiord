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
 * A working Connection keeps its useful content and the editor link.
 * Anything else shows one notice with one fix, worded by the vendored
 * connection-notices.js — the same wording the Kaiord App shows.
 *
 * Only the session verdict is folded into the health record. A background
 * worker that did not answer is inconclusive — it says nothing about whether
 * the Train2Go session is alive — so it neither starts nor clears an outage.
 *
 * Shared helpers load first from the vendored bridge-popup-utils.js,
 * bridge-popup-shell.js, bridge-popup-health.js and bridge-popup-snapshot.js
 * (see popup.html script order).
 */

/* global msg, $, withTimeout, formatSinceDate, recordProbe,
   renderStatusBlock, renderChips, renderSkeleton, renderCtas, renderNotice,
   renderAthleteCard, KAIORD_CONNECTION_NOTICES */

const PHASE_TIMEOUT_MS = 3_000;
const SNAPSHOT_TIMEOUT_MS = 1_000;
const ROLLUP_TIMEOUT_MS = 8_000;
const ROLLUP_TTL_MS = 5 * 60 * 1_000;

const OPEN_EDITOR_URL = "https://kaiord.com/app/";
const OPEN_TRAIN2GO_URL = "https://app.train2go.com/user/index";
// The Platform's name exactly as the Kaiord App's registry spells it, so a
// notice reads the same in both (scripts/check-connection-notices.mjs).
const PLATFORM = "Train2Go";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking your session…",
  checkingCause: "Usually under a second.",
  connected: "Connected",
  connectedAs: "Connected as $1",
  coachSub: "Coach · $1",
  outageSince: "Since $1.",
  captionFeeds: "Feeds Kaiord",
  typePlannedSession: "Planned Session",
  typeTrainingZones: "Training Zones",
  typeWeight: "Weight",
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
  openTrain2go: "Open Train2Go ↗",
  refresh: "Refresh",
};

// Managed data types this bridge imports, named exactly as the Connections
// page names them (@kaiord/core MANAGED_DATA_REGISTRY labels).
const FEED_KEYS = ["typePlannedSession", "typeTrainingZones", "typeWeight"];

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

// Only a check Train2Go itself answered may say the sign-in is gone. Today's
// ping folds a Train2Go outage into the same `sessionActive: false` as a lapsed
// sign-in, so that answer cannot tell them apart and stays "not-answering".
const connectionStateOf = (ping) => {
  if (ping?.ok && ping?.data?.sessionActive) return "working";
  if (ping?.ok && ping?.data?.needsReauth === true) return "signed-out";
  return "not-answering";
};

// Any non-working state pauses the plan feed, so the chips go muted and the
// notice replaces the verdict; its one fix is the whole footer. `since` is
// null for a state the health record cannot date — including every worker
// timeout, which is inconclusive about the session rather than evidence.
const renderBroken = (state, since = null) => {
  const notice = KAIORD_CONNECTION_NOTICES.noticeFor(
    state,
    PLATFORM,
    KAIORD_CONNECTION_NOTICES.EXTENSION_LOCALE
  );
  setMarkEstablished(since !== null);
  renderNotice($, notice, {
    since: since === null ? null : msg("outageSince", [formatSinceDate(since)]),
    href: OPEN_TRAIN2GO_URL,
    onRetry: () => loadPopupData(),
  });
  renderChips($, feedChips("muted"), { caption: msg("captionFeeds") });
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
    renderBroken("not-answering");
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
    renderBroken("not-answering");
    return;
  }

  const state = connectionStateOf(ping);
  const health = await recordProbe(state === "working");
  if (state !== "working") {
    renderAthleteCard(storage.profileSnapshot);
    renderBroken(state, health.since);
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
