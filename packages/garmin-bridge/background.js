/**
 * Kaiord Garmin Bridge — Background Service Worker
 *
 * Captures CSRF token via webRequest, coordinates messaging between
 * SPA ↔ background ↔ content script on connect.garmin.com.
 */

const PROTOCOL_VERSION = 1;
const GARMIN_URL_PATTERN = "https://connect.garmin.com/*";
const GARMIN_DASHBOARD = "https://connect.garmin.com/modern/";

const BRIDGE_MANIFEST = {
  id: "garmin-bridge",
  name: "Garmin Connect",
  version: "7.2.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["write:workouts", "read:activities"],
};

// ── Swallowed-error telemetry ──
//
// Several catch{} blocks below intentionally swallow errors so a single
// failure doesn't break the whole bridge (see the comment at each call
// site). That used to make root-causing "why doesn't X work" impossible
// without opening the service worker's devtools console. This keeps the
// swallow behavior but records a structured, capped log so the cause is
// inspectable — e.g. `chrome.storage.local.get("bridgeTelemetry")` from
// the popup or chrome://extensions devtools.
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
  // In the packaged extension this only fires if the bundled file is
  // missing or fails to parse — a real misconfiguration. Under Node
  // (tests, build tooling) it fires on every load and is expected, so
  // it's logged at "debug" rather than "error".
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bridge-envelope",
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

// ── CSRF token capture ──

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const header = details.requestHeaders?.find(
      (h) => h.name.toLowerCase() === "connect-csrf-token"
    );
    if (header?.value) {
      chrome.storage.session.set({ csrfToken: header.value });
    }
  },
  { urls: [GARMIN_URL_PATTERN] },
  ["requestHeaders"]
);

const getCsrfToken = () =>
  chrome.storage.session.get("csrfToken").then((r) => r.csrfToken ?? null);

// ── Tab helpers ──

const findGarminTab = () =>
  new Promise((resolve) => {
    chrome.tabs.query({ url: GARMIN_URL_PATTERN }, (tabs) => {
      resolve(tabs?.[0] ?? null);
    });
  });

// ── Content script messaging ──

const garminFetch = async (path, method, body) => {
  const tab = await findGarminTab();
  if (!tab) {
    throw new Error(
      "No Garmin Connect tab open. Open connect.garmin.com first."
    );
  }

  const csrfToken = await getCsrfToken();

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "garmin-fetch", path, method, body, csrfToken },
      (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(res);
        }
      }
    );
  });
};

// ── Actions ──

/**
 * Ping handler. Response data shape:
 *   BridgeManifest ∪ { csrfCaptured: boolean, gcApi: object }
 *
 * The outer envelope sent to the SPA via `sendResult` is
 *   { ok: true, protocolVersion: 1, data: <this object> }
 *
 * The SPA reads `response.data` and passes it to
 * `bridgeManifestSchema.safeParse` (defined in
 * `packages/workout-spa-editor/src/types/bridge-schemas.ts`, called
 * from `parseManifestFromPing` in
 * `packages/workout-spa-editor/src/adapters/bridge/bridge-registry-helpers.ts`).
 * Zod strips the session-status fields (csrfCaptured, gcApi); they
 * stay available to popup/UI consumers that read `response.data`
 * directly. Manifest keys (id, name, version, protocolVersion,
 * capabilities) take precedence on collision (the spread
 * `{ ...BRIDGE_MANIFEST, csrfCaptured, gcApi }` writes them last so
 * any rogue id/version coming back from the upstream API cannot
 * spoof the manifest).
 */
const checkSession = async () => {
  const csrfToken = await getCsrfToken();
  const results = { ...BRIDGE_MANIFEST, csrfCaptured: csrfToken !== null };

  try {
    const res = await garminFetch(
      "/workout-service/workouts?start=0&limit=1",
      "GET"
    );
    results.gcApi = res;
  } catch (e) {
    results.gcApi = { ok: false, error: e.message };
  }

  return results;
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
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
// Read-only pull of the athlete's recent Garmin Connect activities via
// the user's authenticated session. Governed SPA-side by a DataRoute
// (activity←garmin — the SPA never asks unless the route is active). This
// handler adds bridge-side safety: a throttle so rapid re-syncs cannot
// hammer Garmin (ToS), retry-with-backoff for transient session hiccups,
// and a kill-switch (chrome.storage.local flag) so the pull can be
// disabled — degrading the SPA to manual FIT import — if Garmin changes
// the endpoint shape. The raw activity feed is returned as-is; mapping to
// the domain `activity` type happens SPA-side where the Zod schema lives.
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

// ── Content-script re-inject after extension reload ──
//
// Chrome terminates content scripts in existing tabs when the extension
// is reloaded but does NOT re-inject them. Tabs at connect.garmin.com
// keep stale, dead listeners — chrome.tabs.sendMessage to them fails
// with "Receiving end does not exist". Re-inject programmatically on
// onInstalled so the user does not have to reload every Garmin tab
// after touching the extension. Only re-inject scripts whose match
// patterns are covered by host_permissions; `kaiord-announce.js` on
// the SPA origin is out of scope (kept as the standard MV3 dev flow).
const reinjectContentScripts = async () => {
  const manifest = chrome.runtime.getManifest();
  const hostPermissions = manifest.host_permissions ?? [];
  for (const script of manifest.content_scripts ?? []) {
    const matches = script.matches.filter((m) => hostPermissions.includes(m));
    if (matches.length === 0) continue;
    const tabs = await chrome.tabs.query({ url: matches });
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: !!script.all_frames },
          files: script.js,
        });
      } catch (e) {
        // Tab may be in a restricted context or already injected; ignore.
        void logSwallowed("warn", "reinject-content-script", e);
      }
    }
  }
};

if (typeof chrome !== "undefined" && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    void reinjectContentScripts();
  });
}

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    EXTERNAL_ACTIONS,
    handleAction,
    handleExternalMessage,
    getCsrfToken,
    findGarminTab,
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
    reinjectContentScripts,
    TELEMETRY_KEY,
    logSwallowed,
  };
}
