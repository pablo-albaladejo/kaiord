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

// ── Swallowed-error telemetry and script loading (vendored bridge-core) ──
let telemetry;
try {
  importScripts("bridge-telemetry.js");
  telemetry = globalThis.bridgeTelemetry;
} catch {
  // Only a missing bridge-telemetry.js lands here in the worker; under Node
  // (tests) it is the normal path.
  telemetry =
    typeof require !== "undefined"
      ? require("./bridge-telemetry.js")
      : { TELEMETRY_KEY: "", logSwallowed: () => {}, loadScript: () => ({}) };
}
const { TELEMETRY_KEY, logSwallowed, loadScript } = telemetry;

// Vendored bridge-core: envelope/dispatch, the popup's theme, the Bearer
// transport (read by garmin-oauth.js, so loaded first), the `request` gate
// and the answer handed to the App.
const bridgeEnvelope = loadScript("bridge-envelope.js");
const bridgeTheme = loadScript("bridge-theme.js");
loadScript("bearer-fetch.js");
const requestGate = loadScript("bridge-request-gate.js", "bridgeRequestGate");
const answerCore = loadScript("bridge-answer.js", "bridgeAnswer");
const snapshotValidator = loadScript("profile-snapshot.js");

// Garmin's own: OAuth token minting + connectapi Bearer calls, the body
// schemas of the write entries (the FIT check loads before them), and the
// one deadline every request runs under.
const garminOAuth = loadScript("garmin-oauth.js", "garminOAuth");
loadScript("garmin-fit-check.js", "garminFitCheck");
const requestBodies = loadScript(
  "garmin-request-bodies.js",
  "garminRequestBodies"
);
const deadline = loadScript("garmin-deadline.js", "garminDeadline");
const BODY_SCHEMAS = requestBodies.BODY_SCHEMAS;

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

// The declared body schemas (garmin-request-bodies.js) let a write carry
// only the workout the App's GCN writer builds, the body-composition FIT
// file or a date, never an arbitrary payload.
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
  const res = await deadline.boundedCall(
    garminOAuth,
    path,
    method,
    toWireBody(path, body)
  );
  if (!res?.ok) throw answerCore.toBridgeError(res);
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
    REQUEST_DEADLINE_MS: deadline.REQUEST_DEADLINE_MS,
    REQUEST_SEND_CUTOFF_MS: deadline.REQUEST_SEND_CUTOFF_MS,
    DEADLINE_BEFORE_SEND: deadline.DEADLINE_BEFORE_SEND,
    DEADLINE_EXCEEDED: deadline.DEADLINE_EXCEEDED,
    openGarmin,
    persistSnapshot,
    clearSnapshot,
    TELEMETRY_KEY,
    logSwallowed,
  };
}
