/**
 * Kaiord Garmin Bridge — Background Service Worker
 *
 * Thin Bridge (docs/adr/0004-thin-bridge-smart-connector.md): the service
 * worker lends the athlete's Garmin Session and executes requests from a
 * closed list of method + path patterns (`ALLOWED`), a body only where an
 * entry declares one and only in the shape it declares, and hands the Kaiord
 * App Garmin's raw answer. What to ask for, how to read the answer, retries,
 * pacing and the mapping to KRD are the App's Garmin Connector.
 *
 * Authenticates with an OAuth token minted from the athlete's browser
 * session (see garmin-oauth.js) only when a real request is about to be
 * sent, and calls connectapi.garmin.com directly with `Authorization:
 * Bearer`. No token ever leaves the service worker.
 */

// 2: the generic `request` action replaced list / push / activities /
// push-body-composition / schedule / unschedule / calendar-find for the App.
// The App accepts version 1 as well.
const PROTOCOL_VERSION = 2;
const GARMIN_DASHBOARD = "https://connect.garmin.com/modern/";

// Contracts this build supports beyond its capabilities, reported by ping.
// Kept out of BRIDGE_MANIFEST: capabilities are a closed enum held in
// lockstep with bridge-identity.js, and an older bridge is recognised by
// the ABSENCE of a flag here. The calendar contract is now served through
// `request` (schedule POST / DELETE and the month read are listed below).
const BRIDGE_FEATURES = ["calendar-write-v1", "calendar-find-v1"];

const BRIDGE_MANIFEST = {
  id: "garmin-bridge",
  name: "Garmin Connect",
  version: "10.4.0",
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

// ── App theme preference for the popup (vendored bridge-core) ──
let bridgeTheme;
try {
  importScripts("bridge-theme.js");
  bridgeTheme = globalThis;
} catch (e) {
  bridgeTheme =
    typeof require !== "undefined" ? require("./bridge-theme.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bridge-theme",
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

// ── The `request` gate: closed list + declared body schemas (vendored) ──
let requestGate;
try {
  importScripts("bridge-request-gate.js");
  requestGate = globalThis.bridgeRequestGate;
} catch (e) {
  requestGate =
    typeof require !== "undefined" ? require("./bridge-request-gate.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bridge-request-gate",
    e
  );
}

// ── The answer handed to the App, Session secrets removed (vendored) ──
let answerCore;
try {
  importScripts("bridge-answer.js");
  answerCore = globalThis.bridgeAnswer;
} catch (e) {
  answerCore =
    typeof require !== "undefined" ? require("./bridge-answer.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bridge-answer",
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

// ── Garmin call surface: the closed list ──
//
// Method + path pattern, and for a write that carries one the name of the
// body schema it must match; nothing else. Every request, the App's
// included, is checked against it before any token is touched or any fetch
// runs; anything else is refused without a request. Locked against drift by
// scripts/check-bridge-privacy-surface.mjs. Ids are canonical decimals (no
// leading zero), queries are the exact ones the App's Connector builds.
const ALLOWED = [
  // prettier-ignore
  { method: "GET", pattern: /^\/workout-service\/workouts\?start=\d+&limit=\d+$/ },
  { method: "POST", pattern: /^\/workout-service\/workout$/, body: "workout" },
  // Multipart FIT upload (body composition → weight_scale).
  // prettier-ignore
  { method: "POST", pattern: /^\/upload-service\/upload\/\.fit$/, body: "fit-file" },
  // prettier-ignore
  { method: "GET", pattern: /^\/activitylist-service\/activities\/search\/activities\?start=\d+&limit=\d+$/ },
  // Calendar placement: POST places a library workout (by workoutId) on a
  // date; DELETE removes one calendar entry (by workoutScheduleId). Library
  // workouts are never deleted.
  // prettier-ignore
  { method: "POST", pattern: /^\/workout-service\/schedule\/[1-9]\d*$/, body: "schedule" },
  // prettier-ignore
  { method: "DELETE", pattern: /^\/workout-service\/schedule\/[1-9]\d*$/ },
  // Calendar read: one month (0-based) of the athlete's calendar.
  // prettier-ignore
  { method: "GET", pattern: /^\/calendar-service\/year\/\d{4}\/month\/\d{1,2}$/ },
];

// ── Declared body schemas (garmin-request-bodies.js) ──
//
// The shape each write entry accepts, so the extension forwards the workout
// the App's GCN writer builds, the body-composition FIT file or a date, and
// never an arbitrary payload.
let requestBodies;
try {
  importScripts("garmin-fit-check.js", "garmin-request-bodies.js");
  requestBodies = globalThis.garminRequestBodies;
} catch (e) {
  requestBodies =
    typeof require !== "undefined" ? require("./garmin-request-bodies.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-garmin-request-bodies",
    e
  );
}
const BODY_SCHEMAS = requestBodies.BODY_SCHEMAS;

const admitRequest = (message) =>
  requestGate.createRequestGate({
    allowed: ALLOWED,
    bodySchemas: BODY_SCHEMAS,
  })(message);

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

// ── Actions ──

/**
 * The Session check, answered to `ping`: no request, no token minted, nothing
 * stored. Response data shape:
 *   BridgeManifest ∪ { features, session, authenticated, gcApi: { ok } }
 *
 * `session` is the typed outcome; `authenticated` and `gcApi.ok` are the
 * booleans older Kaiord Apps and the popup read. No workout, no token and no
 * id is in the answer. Manifest keys come from the bridge's own constant.
 */
const checkSession = async () => {
  const session = await garminOAuth.checkStoredTokens();
  const signedIn = session === "signed-in";
  return {
    ...BRIDGE_MANIFEST,
    features: [...BRIDGE_FEATURES],
    session,
    authenticated: signedIn,
    gcApi: { ok: signedIn },
  };
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  if (res?.needsReauth) err.needsReauth = true;
  return err;
};

// ── One deadline for every request ──
//
// A write is NOT idempotent (two schedule POSTs make two calendar entries),
// so a write whose outcome is unknown must be told apart from one that never
// left, and nothing may start a write the App has already given up waiting
// for. Each request therefore runs under one hard deadline D from handler
// entry, delivered as an abort signal on the request itself and raced
// against the token lifecycle — a joined mint included, see garmin-oauth.js
// `connectapiFetch`. The lifecycle runs on the untimed `fetch`, so a mint
// other callers join is never aborted by this caller's deadline. No write
// starts after SEND_CUTOFF_MS.
//
// D stays below the ~30 s Chrome gives a pending fetch in an MV3 service
// worker, so the bridge, not Chrome, decides how a hung request ends. The
// vendored envelope has no `code` field, so the outcome travels in `error`:
// DEADLINE_BEFORE_SEND (definite — nothing reached Garmin) or
// DEADLINE_EXCEEDED (ambiguous — sent, then aborted; no status). This is
// transport, not reading: what the App does with either is the Connector's.
const REQUEST_DEADLINE_MS = 25000;
const REQUEST_SEND_CUTOFF_MS = 15000;
const DEADLINE_BEFORE_SEND = "deadline-before-send";
const DEADLINE_EXCEEDED = "deadline-exceeded";

const deadlineError = (code) => {
  const err = new Error(code);
  err.retryable = true;
  return err;
};

const boundedCall = async (path, method, body) => {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException(DEADLINE_EXCEEDED, "AbortError")),
    REQUEST_DEADLINE_MS
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
      if (isWrite && performance.now() - startedAt >= REQUEST_SEND_CUTOFF_MS) {
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
      raw: true,
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

// The FIT bytes travel to Garmin as the `file` field of a multipart body;
// the runtime sets the boundary.
const UPLOAD_FILE_NAME = "body-composition.fit";

const toWireBody = (path, body) => {
  if (!path.startsWith("/upload-service/")) return body;
  const form = new FormData();
  form.append(
    "file",
    new Blob([Uint8Array.from(body)], { type: "application/octet-stream" }),
    UPLOAD_FILE_NAME
  );
  return form;
};

// ── The App's one call: a request from the closed list, answered raw ──
const request = async (message) => {
  const { method, path, body } = admitRequest(message);
  const res = await boundedCall(path, method, toWireBody(path, body));
  if (!res?.ok) throw toBridgeError("Request failed", res);
  return answerCore.toAnswer(res);
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
    case "request":
      return await request(message);
    case "open-garmin":
      await openGarmin();
      return null;
    case "profile-snapshot":
      return await persistSnapshot(message.snapshot);
    case "profile-snapshot-clear":
      return await clearSnapshot();
    case "set-theme":
      return await bridgeTheme.storeThemePreference(message.theme);
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
// Every external message is origin-pinned and action-allowlisted by the
// vendored guard (spec: bridge-core). `request` is reachable only here.

const EXTERNAL_ACTIONS = new Set([
  "ping",
  "request",
  "open-garmin",
  "profile-snapshot",
  "profile-snapshot-clear",
  "set-theme",
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
// Only the extension's own pages are answered, never a content script, and
// only the Session check the popup sends.

const INTERNAL_ACTIONS = new Set(["ping"]);

chrome.runtime.onMessage.addListener(
  bridgeEnvelope.createInternalDispatch({
    dispatch,
    internalActions: INTERNAL_ACTIONS,
    protocolVersion: PROTOCOL_VERSION,
  })
);

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    BRIDGE_FEATURES,
    EXTERNAL_ACTIONS,
    INTERNAL_ACTIONS,
    ALLOWED,
    BODY_SCHEMAS,
    isAllowed,
    handleAction,
    handleExternalMessage,
    checkSession,
    request,
    REQUEST_DEADLINE_MS,
    REQUEST_SEND_CUTOFF_MS,
    DEADLINE_BEFORE_SEND,
    DEADLINE_EXCEEDED,
    openGarmin,
    persistSnapshot,
    clearSnapshot,
    TELEMETRY_KEY,
    logSwallowed,
  };
}
