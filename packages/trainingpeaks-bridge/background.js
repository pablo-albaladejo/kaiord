/**
 * Kaiord TrainingPeaks Bridge — Background Service Worker
 *
 * Thin Bridge (docs/adr/0004-thin-bridge-smart-connector.md): the service
 * worker lends the athlete's TrainingPeaks Session and executes requests
 * from a closed list of method + path patterns (`ALLOWED`), a body only
 * where an entry declares one and only in the shape it declares, handing the
 * Kaiord App TrainingPeaks' raw answer. What to ask for, how to read it,
 * pacing and the mapping to KRD are the App's TrainingPeaks Connector
 * (`@kaiord/trainingpeaks` runs there; this bridge never imports it).
 *
 * No password. The durable credential is the athlete's own
 * `Production_tpAuth` session cookie; the service worker exchanges it
 * (cookie-only) for a short-lived Bearer only when a real request is about
 * to be sent, and calls `tpapi.trainingpeaks.com` directly (tp-auth.js). The
 * cookie is never read; the token never leaves the service worker.
 */

// 2: the generic `request` action replaced read-metrics / push-weight /
// push-workout / read-workout for the App. The App accepts version 1 too.
const PROTOCOL_VERSION = 2;
const OPEN_TRAININGPEAKS_URL = "https://app.trainingpeaks.com/";

const BRIDGE_MANIFEST = {
  id: "trainingpeaks-bridge",
  name: "TrainingPeaks",
  version: "10.4.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:body", "write:body", "write:workouts"],
};

// ── Shared envelope/dispatch (vendored bridge-core) ──
let bridgeEnvelope;
try {
  importScripts("bridge-envelope.js");
  bridgeEnvelope = globalThis;
} catch {
  bridgeEnvelope =
    typeof require !== "undefined" ? require("./bridge-envelope.js") : {};
}

// ── App theme preference for the popup (vendored bridge-core) ──
let bridgeTheme;
try {
  importScripts("bridge-theme.js");
  bridgeTheme = globalThis;
} catch {
  bridgeTheme =
    typeof require !== "undefined" ? require("./bridge-theme.js") : {};
}

// ── Identity-free transports (vendored bridge-core) ──
// Loaded BEFORE tp-auth.js so it can read self.cookieSessionFetch (cookie
// token exchange) and self.bearerRequest (Bearer data calls).
try {
  importScripts("session-fetch.js");
} catch {
  // Node test path resolves the master via require inside tp-auth.js.
}
try {
  importScripts("bearer-fetch.js");
} catch {
  // Node test path resolves the master via require inside tp-auth.js.
}

// ── The `request` gate: closed list + declared body schemas (vendored) ──
let requestGate;
try {
  importScripts("bridge-request-gate.js");
  requestGate = globalThis.bridgeRequestGate;
} catch {
  requestGate =
    typeof require !== "undefined" ? require("./bridge-request-gate.js") : {};
}

// ── The answer handed to the App, Session secrets removed (vendored) ──
let answerCore;
try {
  importScripts("bridge-answer.js");
  answerCore = globalThis.bridgeAnswer;
} catch {
  answerCore =
    typeof require !== "undefined" ? require("./bridge-answer.js") : {};
}

// ── Dual-transport auth (bridge-specific; cookie→token→Bearer) ──
let tpAuth;
try {
  importScripts("tp-auth.js");
  tpAuth = globalThis.tpAuth;
} catch {
  tpAuth = typeof require !== "undefined" ? require("./tp-auth.js") : {};
}

// ── TrainingPeaks call surface: the closed list ──
//
// Method + path pattern, and for a write the name of the body schema it must
// match; nothing else. Every request, the App's included, is checked against
// it before any token is minted or any fetch runs. The token endpoint is NOT
// here: its answer is the token, which never leaves the service worker (it
// is pinned as the handshake surface in tp-auth.js instead). Each entry stays on one
// physical line for scripts/check-bridge-privacy-surface.mjs.
const ALLOWED = [
  // prettier-ignore
  { method: "GET", pattern: /^\/metrics\/v3\/athletes\/\d+\/consolidatedtimedmetrics\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/ },
  // prettier-ignore
  { method: "POST", pattern: /^\/metrics\/v3\/athletes\/\d+\/consolidatedtimedmetric$/, body: "weight" },
  // prettier-ignore
  { method: "POST", pattern: /^\/fitness\/v6\/athletes\/\d+\/workouts$/, body: "workout" },
  // prettier-ignore
  { method: "GET", pattern: /^\/fitness\/v6\/athletes\/\d+\/workouts\/\d+$/ },
  // One day of the athlete's workouts (start and end the same date): read
  // only after a send got no answer, to ask before sending it again.
  // prettier-ignore
  { method: "GET", pattern: /^\/fitness\/v6\/athletes\/\d+\/workouts\/(\d{4}-\d{2}-\d{2})\/\1$/ },
];

// ── Declared body schemas ──
//
// The shapes @kaiord/trainingpeaks builds, so the extension forwards a new
// planned workout or one weight and never an arbitrary payload. A workout's
// `structure` is the JSON string TrainingPeaks requires, bounded in size.
const WEIGHT_TYPE = 9;
const DATE_TIME = { type: "string", min: 1, max: 40 };

const BODY_SCHEMAS = {
  workout: {
    type: "object",
    fields: {
      athleteId: { type: "integer", min: 1 },
      workoutId: { type: "literal", value: 0 },
      workoutDay: { type: "date" },
      title: { type: "string", max: 255 },
      description: { type: "string", max: 10000, nullable: true },
      workoutTypeValueId: { type: "integer", min: 1 },
      totalTimePlanned: { type: "number", min: 0 },
      publicSettingValue: { type: "literal", value: 0 },
      structure: { type: "string", max: 262144 },
    },
  },
  weight: {
    type: "object",
    fields: {
      athleteId: { type: "integer", min: 1 },
      timeStamp: DATE_TIME,
      id: { type: "literal", value: null },
      details: {
        type: "array",
        min: 1,
        max: 1,
        items: {
          type: "object",
          fields: {
            type: { type: "literal", value: WEIGHT_TYPE },
            label: { type: "string", max: 32 },
            value: { type: "number", min: 0 },
            time: DATE_TIME,
            units: { type: "string", max: 8 },
            formatedUnits: { type: "string", max: 8 },
          },
        },
      },
    },
  },
};

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

// ── Actions ──

// The Session check: no request, no token minted, nothing stored. Answers
// only the manifest, the typed outcome and the legacy boolean older Kaiord
// Apps read; never the token, never the athlete id.
const checkSession = async () => {
  const session = await tpAuth.checkStoredToken();
  return {
    ...BRIDGE_MANIFEST,
    session,
    authenticated: session === "signed-in",
  };
};

// The athlete id a write is built against, read when the Kaiord App is about
// to send: this is where the token is minted, because a write follows.
const readAthleteId = async () => {
  const athleteId = await tpAuth.ensureAthleteId(fetch);
  if (athleteId === null || athleteId === undefined) {
    throw new Error("Could not resolve TrainingPeaks athlete id");
  }
  return { athleteId };
};

// ── The App's one call: a request from the closed list, answered raw ──
const request = async (message) => {
  const { method, path, body } = requestGate.createRequestGate({
    allowed: ALLOWED,
    bodySchemas: BODY_SCHEMAS,
  })(message);
  const res = await tpAuth.tpapiFetch(path, method, body, fetch, { raw: true });
  if (!res?.ok) throw answerCore.toBridgeError(res);
  return answerCore.toAnswer(res);
};

const openTrainingPeaks = async () => {
  await chrome.tabs.create({ url: OPEN_TRAININGPEAKS_URL });
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
    case "checkSession":
      return await checkSession();
    case "request":
      return await request(message);
    case "read-athlete-id":
      return await readAthleteId();
    case "open-trainingpeaks":
      await openTrainingPeaks();
      return null;
    case "set-theme":
      return await bridgeTheme.storeThemePreference(message.theme);
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
// Every external message is origin-pinned and action-allowlisted by the
// vendored envelope guard. `request` is reachable only here.
const EXTERNAL_ACTIONS = new Set([
  "ping",
  "checkSession",
  "request",
  "read-athlete-id",
  "open-trainingpeaks",
  "set-theme",
]);

// ── Internal messages (popup) ──
// Only the extension's own pages are answered, never a content script, and
// only the Session check the popup sends.
const INTERNAL_ACTIONS = new Set(["checkSession"]);

const dispatch = bridgeEnvelope.createDispatch({
  handleAction,
  protocolVersion: PROTOCOL_VERSION,
});

const dispatchExternal = bridgeEnvelope.createExternalDispatch({
  dispatch,
  externalActions: EXTERNAL_ACTIONS,
  protocolVersion: PROTOCOL_VERSION,
});

if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, sender, respond) =>
    dispatchExternal(message, sender, respond)
  );
  chrome.runtime.onMessage.addListener(
    bridgeEnvelope.createInternalDispatch({
      dispatch,
      internalActions: INTERNAL_ACTIONS,
      protocolVersion: PROTOCOL_VERSION,
    })
  );
}

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    ALLOWED,
    BODY_SCHEMAS,
    isAllowed,
    request,
    checkSession,
    readAthleteId,
    openTrainingPeaks,
    handleAction,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
    INTERNAL_ACTIONS,
  };
}
