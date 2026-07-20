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

const BRIDGE_MANIFEST = {
  id: "garmin-bridge",
  name: "Garmin Connect",
  version: "10.0.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["write:workouts", "read:activities"],
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
  // Read-only pull of the athlete's recent activities (F5). GET only —
  // the executed-activity feed is never mutated through the bridge.
  {
    method: "GET",
    pattern: /^\/activitylist-service\/activities\/search\/activities(\?.*)?$/,
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
  const results = { ...BRIDGE_MANIFEST };
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
  "open-garmin",
  "profile-snapshot",
  "profile-snapshot-clear",
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
    EXTERNAL_ACTIONS,
    ALLOWED,
    isAllowed,
    handleAction,
    handleExternalMessage,
    garminFetch,
    checkSession,
    listWorkouts,
    listActivities,
    fetchActivitiesWithBackoff,
    isActivitiesPullDisabled,
    pushWorkout,
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
