/**
 * Kaiord Garmin Bridge — Background Service Worker
 *
 * Authenticates to Garmin with an OAuth token minted from the user's browser
 * session (see garmin-oauth.js) and calls connectapi.garmin.com directly with
 * `Authorization: Bearer`. No Garmin tab, content script, or CSRF capture is
 * involved. Routes SPA ↔ background messages for list/push/activities/snapshot.
 */

const PROTOCOL_VERSION = 1;
const GARMIN_DASHBOARD = "https://connect.garmin.com/modern/";

// Contracts this build supports beyond its capabilities, reported by ping.
// Kept out of BRIDGE_MANIFEST: capabilities are a closed enum held in
// lockstep with bridge-identity.js, and an older bridge is recognised by
// the ABSENCE of a flag here.
const BRIDGE_FEATURES = ["calendar-write-v1", "calendar-find-v1"];

const BRIDGE_MANIFEST = {
  id: "garmin-bridge",
  name: "Garmin Connect",
  version: "10.1.1",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["write:workouts", "read:activities", "write:body"],
};

// ── Swallowed-error telemetry ──
//
// Several catch{} blocks below intentionally swallow errors so a single
// failure doesn't break the whole bridge (see the comment at each call
// site). This keeps the swallow behavior but records a structured, capped
// log so the cause is inspectable — e.g.
// `chrome.storage.local.get("bridgeTelemetry")` from the popup or
// chrome://extensions devtools.
const TELEMETRY_KEY = "bridgeTelemetry";
const TELEMETRY_MAX_ENTRIES = 25;

// Writes are chained so concurrent calls cannot interleave their
// read-modify-write cycles and silently drop each other's entries.
let telemetryWrite = Promise.resolve();

const logSwallowed = (level, action, cause) => {
  const entry = {
    level,
    action,
    cause: String(cause?.message ?? cause),
    at: Date.now(),
  };
  telemetryWrite = telemetryWrite
    .then(() => chrome.storage.local.get(TELEMETRY_KEY))
    .then(({ [TELEMETRY_KEY]: existing = [] }) =>
      chrome.storage.local.set({
        [TELEMETRY_KEY]: [...existing, entry].slice(-TELEMETRY_MAX_ENTRIES),
      })
    )
    .catch(() => {
      // Storage itself unavailable (e.g. quota); nothing more we can do.
    });
  return telemetryWrite;
};

// ── Shared envelope/dispatch (vendored bridge-core) ──
let bridgeEnvelope;
try {
  importScripts("bridge-envelope.js");
  bridgeEnvelope = globalThis;
} catch (e) {
  bridgeEnvelope =
    typeof require !== "undefined" ? require("./bridge-envelope.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bridge-envelope",
    e
  );
}

// ── Bearer transport (vendored bridge-core; consumed by garmin-oauth.js) ──
// Loaded before garmin-oauth so the SW exposes self.bearerFetch/bearerRequest.
try {
  importScripts("bearer-fetch.js");
} catch (e) {
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bearer-fetch",
    e
  );
}

// ── OAuth token minting + connectapi Bearer calls (bridge-specific) ──
let garminOAuth;
try {
  importScripts("garmin-oauth.js");
  garminOAuth = globalThis.garminOAuth;
} catch (e) {
  garminOAuth =
    typeof require !== "undefined" ? require("./garmin-oauth.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-garmin-oauth",
    e
  );
}

// ── Profile snapshot validator (plain JS, parity-tested via shared fixtures) ──
let snapshotValidator;
try {
  importScripts("profile-snapshot.js");
  snapshotValidator = globalThis;
} catch (e) {
  snapshotValidator =
    typeof require !== "undefined" ? require("./profile-snapshot.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-profile-snapshot",
    e
  );
}

// ── Garmin call surface ──
//
// Defense-in-depth allowlist: even though the SPA can only trigger fixed
// paths (list/push/activities never take a caller-supplied path), the bridge
// still refuses to hit any Garmin endpoint outside this set. Locked against
// drift by scripts/check-bridge-privacy-surface.mjs.
const ALLOWED = [
  { method: "GET", pattern: /^\/workout-service\/workouts(\?.*)?$/ },
  { method: "POST", pattern: /^\/workout-service\/workout$/ },
  // Multipart FIT upload (body composition → weight_scale). POST only — the
  // write surface is a single fixed upload endpoint (optionally `/.fit`).
  { method: "POST", pattern: /^\/upload-service\/upload(\/.*)?$/ },
  // Read-only pull of the athlete's recent activities (F5). GET only —
  // the executed-activity feed is never mutated through the bridge.
  {
    method: "GET",
    pattern: /^\/activitylist-service\/activities\/search\/activities(\?.*)?$/,
  },
  // Calendar placement: POST places a library workout (by workoutId) on a
  // date; DELETE removes one calendar entry (by workoutScheduleId). Digits
  // only — no query string, no sub-path. Library workouts are never deleted.
  { method: "POST", pattern: /^\/workout-service\/schedule\/\d+$/ },
  { method: "DELETE", pattern: /^\/workout-service\/schedule\/\d+$/ },
  // Calendar read: one month (0-based) of the athlete's calendar, filtered
  // down to one workout's entries inside the service worker.
  {
    method: "GET",
    pattern: /^\/calendar-service\/year\/\d{4}\/month\/\d{1,2}$/,
  },
];

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

// Bearer call against connectapi.garmin.com. Returns the same envelope the
// old content-script relay did: { ok, status, data } | { ok:false, ... }.
const garminFetch = async (path, method, body) => {
  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  return garminOAuth.connectapiFetch(path, method || "GET", body, fetch);
};

// ── Actions ──

/**
 * Ping handler. Response data shape:
 *   BridgeManifest ∪ { authenticated: boolean, gcApi: object }
 *
 * The SPA reads `response.data` and passes it to `bridgeManifestSchema`
 * (Zod strips the session-status fields authenticated/gcApi). The popup
 * reads `data.gcApi.ok` for the connection pill. Manifest keys take
 * precedence on collision — the spread writes them last so a rogue
 * id/version from the upstream API cannot spoof the manifest.
 */
const checkSession = async () => {
  const results = { ...BRIDGE_MANIFEST, features: [...BRIDGE_FEATURES] };
  try {
    const res = await garminFetch(
      "/workout-service/workouts?start=0&limit=1",
      "GET"
    );
    results.gcApi = res;
    results.authenticated = res.ok === true;
  } catch (e) {
    results.gcApi = { ok: false, error: e.message };
    results.authenticated = false;
  }
  return results;
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  if (res?.needsReauth) err.needsReauth = true;
  return err;
};

const listWorkouts = async () => {
  const res = await garminFetch(
    "/workout-service/workouts?start=0&limit=20",
    "GET"
  );
  if (!res?.ok) throw toBridgeError("List failed", res);
  return res.data;
};

const pushWorkout = async (gcn) => {
  const res = await garminFetch("/workout-service/workout", "POST", gcn);
  if (!res?.ok) throw toBridgeError("Push failed", res);
  return res.data;
};

// ── Calendar placement (schedule / unschedule) ──
//
// The schedule POST is NOT idempotent: two identical calls make two
// calendar entries. So a write whose outcome is unknown must be told apart
// from one that never left, and nothing may start a write the SPA has
// already given up waiting for. Each action therefore runs under one hard
// deadline D from handler entry, delivered as an abort signal on the
// request itself and raced against the token lifecycle — a joined mint
// included, see garmin-oauth.js `connectapiFetch`. The lifecycle runs on the
// untimed `fetch`, so a mint other callers join is never aborted by this
// caller's deadline. No write starts after SEND_CUTOFF_MS.
//
// D stays below the ~30 s Chrome gives a pending fetch in an MV3 service
// worker, so the bridge, not Chrome, decides how a hung write ends.
//
// The vendored envelope has no `code` field, so the outcome travels in
// `error`: DEADLINE_BEFORE_SEND (definite — nothing reached Garmin) or
// DEADLINE_EXCEEDED (ambiguous — sent, then aborted; no status).
const CALENDAR_DEADLINE_MS = 25000;
const CALENDAR_SEND_CUTOFF_MS = 15000;
const DEADLINE_BEFORE_SEND = "deadline-before-send";
const DEADLINE_EXCEEDED = "deadline-exceeded";
const SCHEDULE_PATH_PREFIX = "/workout-service/schedule/";

// Canonical decimal ids only: Garmin ids are positive and carry no leading
// zero, and calendar-find compares them as String(number).
const GARMIN_ID = /^[1-9]\d*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isGarminId = (v) => typeof v === "string" && GARMIN_ID.test(v);

// A real calendar date, not merely the shape (rejects 2026-02-30).
const isIsoDate = (v) => {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return false;
  const ms = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === v;
};

const refusal = (message) => {
  const err = new Error(message);
  err.retryable = false;
  return err;
};

const deadlineError = (code) => {
  const err = new Error(code);
  err.retryable = true;
  return err;
};

// A write (POST/DELETE) is gated by the send cut-off; a read is not, but
// all three share the deadline and the "sent" bookkeeping.
const calendarCall = async (path, method, body) => {
  if (!isAllowed(method, path)) {
    throw refusal("Blocked: disallowed path or method");
  }
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException(DEADLINE_EXCEEDED, "AbortError")),
    CALENDAR_DEADLINE_MS
  );
  const callUrl = `${garminOAuth.CONNECTAPI}${path}`;
  const isWrite = method !== "GET";
  // `sent`: the call left without a definitive refusal. A 401 means Garmin
  // rejected the token before processing it, so it resets it.
  let sent = false;
  let cutOff = false;
  const fetchImpl = async (url, init = {}) => {
    const isCall = url === callUrl;
    if (isCall) {
      if (isWrite && performance.now() - startedAt >= CALENDAR_SEND_CUTOFF_MS) {
        cutOff = true;
        throw deadlineError(DEADLINE_BEFORE_SEND);
      }
      sent = true;
    }
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (isCall && res.status === 401) sent = false;
    return res;
  };
  try {
    return await garminOAuth.connectapiFetch(path, method, body, fetchImpl, {
      signal: controller.signal,
      tokenFetchImpl: fetch,
    });
  } catch (e) {
    // Nothing sent: any abort — ours or not — is definite.
    const aborted = controller.signal.aborted || garminOAuth.isAbortError(e);
    if (cutOff || (aborted && !sent)) throw deadlineError(DEADLINE_BEFORE_SEND);
    if (controller.signal.aborted) throw deadlineError(DEADLINE_EXCEEDED);
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

// Garmin answers a numeric id; the SPA's branded ids are digit strings.
const toScheduleId = (v) => {
  if (typeof v === "number" && Number.isSafeInteger(v) && v > 0) {
    return String(v);
  }
  return isGarminId(v) ? v : null;
};

// Returns only the schedule id (null when a 2xx carries none) — the rest of
// Garmin's response (the whole workout) is not relayed.
const scheduleWorkout = async (workoutId, date) => {
  if (!isGarminId(workoutId)) throw refusal("Invalid workoutId");
  if (!isIsoDate(date)) throw refusal("Invalid date");
  const res = await calendarCall(
    `${SCHEDULE_PATH_PREFIX}${workoutId}`,
    "POST",
    { date }
  );
  if (!res?.ok) throw toBridgeError("Schedule failed", res);
  return { workoutScheduleId: toScheduleId(res.data?.workoutScheduleId) };
};

const unscheduleWorkout = async (scheduleId) => {
  if (!isGarminId(scheduleId)) throw refusal("Invalid scheduleId");
  const res = await calendarCall(
    `${SCHEDULE_PATH_PREFIX}${scheduleId}`,
    "DELETE"
  );
  if (!res?.ok) throw toBridgeError("Unschedule failed", res);
  return null;
};

// The calendar read. Garmin answers a whole month of the athlete's calendar
// (activities, races, badges, workouts…); only the entries of one workout
// leave the service worker, as { workoutScheduleId, date }. A payload that
// is not the expected shape is a failed read, never "found 0": the SPA
// re-POSTs only on a proven absence.
const CALENDAR_MONTH_PATH = (year, month0) =>
  `/calendar-service/year/${year}/month/${month0}`;

// Garmin's month parameter is 0-based (T0b: October is month 9).
const toMonthPath = (date) =>
  CALENDAR_MONTH_PATH(date.slice(0, 4), Number(date.slice(5, 7)) - 1);

const unreadable = () => {
  const err = new Error("Calendar read returned an unexpected payload");
  err.retryable = true;
  return err;
};

const pickWorkoutEntries = (payload, workoutId) => {
  const items = payload?.calendarItems;
  if (!Array.isArray(items)) throw unreadable();
  const entries = items.filter(
    (item) =>
      item?.itemType === "workout" && toScheduleId(item.workoutId) === workoutId
  );
  if (entries.some((item) => !isIsoDate(item.date))) throw unreadable();
  return entries.map((item) => ({
    workoutScheduleId: toScheduleId(item.id),
    date: item.date,
  }));
};

const findCalendarEntries = async (workoutId, date) => {
  if (!isGarminId(workoutId)) throw refusal("Invalid workoutId");
  if (!isIsoDate(date)) throw refusal("Invalid date");
  const res = await calendarCall(toMonthPath(date), "GET");
  if (!res?.ok) throw toBridgeError("Calendar read failed", res);
  return pickWorkoutEntries(res.data, workoutId);
};

// ── Body-composition upload (multipart FIT) ──
//
// The SPA encodes the FIT bytes (a weight_scale/mesgNum-30 message carrying
// weight + composition) and hands them here as a base64 string or a byte
// array. The bridge wraps them in a FormData `file` field and POSTs them to
// Garmin's upload endpoint with Bearer auth (never cookies). The multipart
// boundary is set by the runtime — no JSON content-type.
const UPLOAD_PATH = "/upload-service/upload/.fit";
const UPLOAD_FILE_NAME = "body-composition.fit";

const toUint8Array = (fit) => {
  if (typeof fit === "string") {
    const binary = atob(fit);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  if (Array.isArray(fit)) return Uint8Array.from(fit);
  throw new Error("Invalid FIT payload: expected base64 string or byte array");
};

const garminUpload = async (formData) => {
  if (!isAllowed("POST", UPLOAD_PATH)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  return garminOAuth.connectapiUpload(UPLOAD_PATH, formData, fetch);
};

const pushBodyComposition = async (fit) => {
  const bytes = toUint8Array(fit);
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: "application/octet-stream" }),
    UPLOAD_FILE_NAME
  );
  const res = await garminUpload(form);
  if (!res?.ok) throw toBridgeError("Body composition upload failed", res);
  return res.data;
};

// ── Garmin activities pull (F5) ──
//
// Read-only pull of the athlete's recent Garmin Connect activities. Governed
// SPA-side by a DataRoute (activity←garmin — the SPA never asks unless the
// route is active). This handler adds bridge-side safety: a throttle so rapid
// re-syncs cannot hammer Garmin (ToS), retry-with-backoff for transient
// hiccups, and a kill-switch (chrome.storage.local flag) so the pull can be
// disabled — degrading the SPA to manual FIT import — if Garmin changes the
// endpoint shape. The raw feed is returned as-is; mapping to the domain
// `activity` type happens SPA-side where the Zod schema lives.
const ACTIVITIES_PATH =
  "/activitylist-service/activities/search/activities?start=0&limit=20";
const ACTIVITIES_KILL_SWITCH_KEY = "activitiesPullDisabled";
const ACTIVITIES_LAST_FETCH_KEY = "lastActivitiesFetchAt";
const ACTIVITIES_MIN_INTERVAL_MS = 30000;
const ACTIVITIES_MAX_ATTEMPTS = 3;
const ACTIVITIES_BACKOFF_BASE_MS = 500;

const isActivitiesPullDisabled = () =>
  chrome.storage.local
    .get(ACTIVITIES_KILL_SWITCH_KEY)
    .then((r) => r[ACTIVITIES_KILL_SWITCH_KEY] === true);

const sleep = (ms) =>
  ms > 0
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();

const fetchActivitiesOnce = async () => {
  const res = await garminFetch(ACTIVITIES_PATH, "GET");
  if (!res?.ok) throw toBridgeError("Activities pull failed", res);
  return res.data;
};

const fetchActivitiesWithBackoff = async (maxAttempts, backoffBaseMs) => {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fetchActivitiesOnce();
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts - 1) await sleep(backoffBaseMs * 2 ** attempt);
    }
  }
  throw lastErr;
};

// Synchronous in-flight latch: chrome.storage has no compare-and-set, so the
// async read/write throttle alone lets two overlapping "activities" actions
// both pass the interval check. The latch is set before the first await.
let activitiesPullInFlight = false;

const listActivities = async (opts = {}) => {
  const {
    minIntervalMs = ACTIVITIES_MIN_INTERVAL_MS,
    maxAttempts = ACTIVITIES_MAX_ATTEMPTS,
    backoffBaseMs = ACTIVITIES_BACKOFF_BASE_MS,
  } = opts;

  if (activitiesPullInFlight) {
    return { activities: [], disabled: false, throttled: true };
  }
  activitiesPullInFlight = true;
  try {
    if (await isActivitiesPullDisabled()) {
      return { activities: [], disabled: true, throttled: false };
    }

    const now = Date.now();
    const { [ACTIVITIES_LAST_FETCH_KEY]: last = 0 } =
      await chrome.storage.session.get(ACTIVITIES_LAST_FETCH_KEY);
    if (now - last < minIntervalMs) {
      return { activities: [], disabled: false, throttled: true };
    }
    await chrome.storage.session.set({ [ACTIVITIES_LAST_FETCH_KEY]: now });

    const data = await fetchActivitiesWithBackoff(maxAttempts, backoffBaseMs);
    return {
      activities: Array.isArray(data) ? data : [],
      disabled: false,
      throttled: false,
    };
  } finally {
    activitiesPullInFlight = false;
  }
};

const openGarmin = async () => {
  await chrome.tabs.create({ url: GARMIN_DASHBOARD });
};

const persistSnapshot = async (snapshot) => {
  const result = snapshotValidator.validateSnapshot(snapshot);
  if (!result.ok) {
    const err = new Error(result.error);
    err.retryable = false;
    throw err;
  }
  const receivedAt = Date.now();
  await chrome.storage.local.set({
    profileSnapshot: { ...result.value, receivedAt },
    lastPushReceipt: { at: receivedAt, name: result.value.profile.name },
  });
  return { storedAt: receivedAt };
};

const clearSnapshot = async () => {
  await chrome.storage.local.remove([
    "profileSnapshot",
    "lastWeeklyRollup",
    "lastPushReceipt",
  ]);
  return null;
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
      return await checkSession();
    case "list":
      return await listWorkouts();
    case "activities":
      return await listActivities();
    case "push":
      if (!message.gcn) throw new Error("Missing gcn payload");
      return await pushWorkout(message.gcn);
    case "push-body-composition":
      if (!message.fit) throw new Error("Missing fit payload");
      return await pushBodyComposition(message.fit);
    case "schedule":
      return await scheduleWorkout(message.workoutId, message.date);
    case "unschedule":
      return await unscheduleWorkout(message.scheduleId);
    case "calendar-find":
      return await findCalendarEntries(message.workoutId, message.date);
    case "open-garmin":
      await openGarmin();
      return null;
    case "profile-snapshot":
      return await persistSnapshot(message.snapshot);
    case "profile-snapshot-clear":
      return await clearSnapshot();
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
// Every external message is origin-pinned and action-allowlisted by the
// vendored guard (spec: bridge-core). The allowlist equals this bridge's
// full action surface — the popup uses the internal channel.

const EXTERNAL_ACTIONS = new Set([
  "ping",
  "list",
  "activities",
  "push",
  "push-body-composition",
  "open-garmin",
  "profile-snapshot",
  "profile-snapshot-clear",
  "schedule",
  "unschedule",
  "calendar-find",
]);

const dispatch = bridgeEnvelope.createDispatch({
  handleAction,
  protocolVersion: PROTOCOL_VERSION,
});

const handleExternalMessage = bridgeEnvelope.createExternalDispatch({
  dispatch,
  externalActions: EXTERNAL_ACTIONS,
  protocolVersion: PROTOCOL_VERSION,
});

chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

// ── Internal messages (popup) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) =>
  dispatch(message, sendResponse)
);

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    BRIDGE_FEATURES,
    EXTERNAL_ACTIONS,
    ALLOWED,
    isAllowed,
    handleAction,
    handleExternalMessage,
    garminFetch,
    garminUpload,
    checkSession,
    listWorkouts,
    listActivities,
    fetchActivitiesWithBackoff,
    isActivitiesPullDisabled,
    pushWorkout,
    scheduleWorkout,
    unscheduleWorkout,
    findCalendarEntries,
    isIsoDate,
    CALENDAR_DEADLINE_MS,
    CALENDAR_SEND_CUTOFF_MS,
    DEADLINE_BEFORE_SEND,
    DEADLINE_EXCEEDED,
    pushBodyComposition,
    toUint8Array,
    UPLOAD_PATH,
    openGarmin,
    ACTIVITIES_PATH,
    ACTIVITIES_KILL_SWITCH_KEY,
    ACTIVITIES_LAST_FETCH_KEY,
    ACTIVITIES_MIN_INTERVAL_MS,
    persistSnapshot,
    clearSnapshot,
    TELEMETRY_KEY,
    logSwallowed,
  };
}
