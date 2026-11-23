/**
 * Kaiord Train2Go Bridge — Background Service Worker
 *
 * Thin Bridge (docs/adr/0004-thin-bridge-smart-connector.md): the service
 * worker lends the athlete's Train2Go Session and executes requests from a
 * closed list of method + path patterns (`ALLOWED`), answering the Kaiord
 * App with Train2Go's raw answer. What to ask for, how to read the answer,
 * retries and the mapping to KRD are the App's Train2Go Connector.
 *
 * Requests go to app.train2go.com with `credentials:"include"`, so the
 * site's HttpOnly session cookie travels automatically; the cookie is never
 * read. A dead session (redirect / login response) is surfaced as
 * needsReauth. What still parses here (parser.js) serves the popup only.
 */

// 2: the generic `request` action replaced read-week / read-day /
// read-details for the App. The App accepts version 1 as well.
const PROTOCOL_VERSION = 2;
const TRAIN2GO_ORIGIN = "https://app.train2go.com";
const TRAIN2GO_DASHBOARD = "https://app.train2go.com/user/index";

const BRIDGE_MANIFEST = {
  id: "train2go-bridge",
  name: "Kaiord Train2Go Bridge",
  version: "10.4.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:training-plan", "read:training-zones", "read:body"],
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

// ── Parser (loaded inline for service worker) ──
// In the extension, parser.js is loaded via importScripts or inlined.
// For testing, it's required via module.exports.
let parser;
try {
  importScripts("parser.js");
  parser = globalThis;
} catch (e) {
  parser = typeof require !== "undefined" ? require("./parser.js") : {};
  // In the packaged extension this only fires if the bundled file is
  // missing or fails to parse — a real misconfiguration. Under Node
  // (tests, build tooling) it fires on every load and is expected, so
  // it's logged at "debug" rather than "error".
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-parser",
    e
  );
}

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

// ── Identity-free cookie transport (vendored bridge-core) ──
let sessionFetch;
try {
  importScripts("session-fetch.js");
  sessionFetch = globalThis;
} catch (e) {
  sessionFetch =
    typeof require !== "undefined" ? require("./session-fetch.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-session-fetch",
    e
  );
}

// ── Train2Go call surface: the closed list ──
//
// Method + path pattern, nothing else: every request, the App's included,
// is checked against it before any fetch runs; anything else is refused
// without a request. Locked
// against drift by scripts/check-bridge-privacy-surface.mjs, which parses
// `method: "..."` and `pattern: /.../` off each single physical line — don't
// let prettier wrap the long regexes.
const ALLOWED = [
  { method: "GET", pattern: /^\/api\/v2\/profile\/ping$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/api\/v2\/workplan\/weekly\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/api\/v2\/workplan\/daily\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/ },
  { method: "GET", pattern: /^\/api\/v2\/workplan\/tooltip\/activity\/\d+$/ },
  // Server-rendered HTML page the App's Connector reads zones and weight
  // from.
  { method: "GET", pattern: /^\/user\/details$/ },
];

const isAllowed = (method, path) =>
  sessionFetch.isPathAllowed(ALLOWED, method, path);

// Reads the response body of the popup's own reads (ping, weekly) by
// Content-Type: text/html verbatim, everything else as a JSON API payload.
const parseBody = (contentType, body) =>
  /^\s*text\/html\b/i.test(contentType || "") ? body : JSON.parse(body);

// ── SW-direct cookie fetch ──
//
// GET a first-party Train2Go endpoint on the user's existing cookie session
// via the identity-free session-fetch master. Returns the same envelope the
// callers below already consume: { ok, status, data } on success, or
// { ok:false, needsReauth?, status?, error } on a dead session / failure.
const train2goFetch = async (path, method = "GET") => {
  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TRAIN2GO_ORIGIN}${path}`,
    method,
    fetchImpl: fetch,
  });
  if (!res.ok) {
    return {
      ok: false,
      ...(res.needsReauth ? { needsReauth: true } : {}),
      ...(typeof res.status === "number" ? { status: res.status } : {}),
      error: res.error,
    };
  }
  let data;
  try {
    data = parseBody(res.contentType, res.body);
  } catch {
    return { ok: false, status: res.status, error: "Malformed response body" };
  }
  return { ok: true, status: res.status, data };
};

// ── Actions ──

// The Session check, answered to `ping`: one GET of the profile ping, the
// cheapest Train2Go request that tells a live session from a dead one. Only
// the outcome leaves the service worker; the profile in the body is dropped
// here. Train2Go saying the session is gone (a redirect, 401/403, or
// `success: false`) is a verified "signed-out"; anything else that fails is
// "not-answering", never signed out.
// The typed outcome of one profile-ping answer, shared by the Session check
// and the popup's profile read so both word one answer the same way.
const sessionOutcomeOf = (res) => {
  if (res?.ok) {
    if (parser.parsePingJson(res.data).sessionActive) return "signed-in";
    return res.data?.success === false ? "signed-out" : "not-answering";
  }
  return res?.needsReauth ? "signed-out" : "not-answering";
};

const checkSession = async () => {
  let session;
  try {
    session = sessionOutcomeOf(await train2goFetch("/api/v2/profile/ping"));
  } catch (e) {
    void logSwallowed("warn", "ping", e);
    session = "not-answering";
  }
  const signedIn = session === "signed-in";
  return {
    ...BRIDGE_MANIFEST,
    session,
    authenticated: signedIn,
    sessionActive: signedIn,
  };
};

// Popup only (internal channel): the explicit read behind what the popup
// shows when the athlete opens it, the athlete's name, the coach's name and
// notes, and the id its weekly figures are read for. The Kaiord App never
// gets this: it reads the profile ping raw through `request` when it links.
// Spread session FIRST, then BRIDGE_MANIFEST, so manifest fields cannot be
// spoofed by a future Train2Go API change that returns keys of the same name.
const readProfile = async () => {
  try {
    const res = await train2goFetch("/api/v2/profile/ping");
    if (!res?.ok) {
      return {
        ...BRIDGE_MANIFEST,
        sessionActive: false,
        session: sessionOutcomeOf(res),
      };
    }
    const session = parser.parsePingJson(res.data);
    return {
      ...session,
      ...BRIDGE_MANIFEST,
      session: sessionOutcomeOf(res),
      sessionActive: session.sessionActive,
      userId: session.userId,
      userName: session.userName,
    };
  } catch (e) {
    void logSwallowed("warn", "read-profile", e);
    return {
      ...BRIDGE_MANIFEST,
      sessionActive: false,
      session: "not-answering",
    };
  }
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  // Preserve the session-expiry signal end-to-end: the envelope surfaces
  // needsReauth so the SPA can prompt a re-login.
  if (res?.needsReauth) err.needsReauth = true;
  return err;
};

// Popup only (internal channel): the inputs of its weekly figures.
const readWeek = async (date, userId) => {
  const path = `/api/v2/workplan/weekly/${date}?user=${userId}`;
  const res = await train2goFetch(path);
  if (!res?.ok) throw toBridgeError("Read week failed", res);

  const html = res.data?.data?.replace?.["#workplan"] ?? "";
  return { activities: parser.parseWeeklyHtml(html) };
};

// ── The App's one read: a request from the closed list, answered raw ──
const REQUEST_KEYS = new Set(["action", "method", "path"]);

const refuseRequest = () => {
  const err = new Error("Request not allowed");
  err.retryable = false;
  return err;
};

const request = async (message) => {
  const { method, path } = message;
  const onlyMethodAndPath = Object.keys(message).every((k) =>
    REQUEST_KEYS.has(k)
  );
  if (
    !onlyMethodAndPath ||
    typeof method !== "string" ||
    typeof path !== "string" ||
    !isAllowed(method, path)
  ) {
    throw refuseRequest();
  }
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TRAIN2GO_ORIGIN}${path}`,
    method,
    fetchImpl: fetch,
  });
  if (!res.ok) throw toBridgeError("Request failed", res);
  return { status: res.status, contentType: res.contentType, body: res.body };
};

const openTrain2Go = async () => {
  await chrome.tabs.create({ url: TRAIN2GO_DASHBOARD });
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
    case "read-profile":
      return await readProfile();
    case "request":
      return await request(message);
    case "read-week":
      if (!message.userId) throw new Error("Missing userId");
      return await readWeek(message.date, message.userId);
    case "open-train2go":
      await openTrain2Go();
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
  "open-train2go",
  "profile-snapshot",
  "profile-snapshot-clear",
  "set-theme",
]);

// No credential handshake: this bridge mints nothing and exchanges nothing.
// The Train2Go session cookie rides along on each read
// (`credentials:"include"` in session-fetch.js), and every one of those
// reads is gated by `isAllowed` above — so the whole network surface is
// already ALLOWED.
//
// Declared empty rather than omitted. scripts/check-bridge-privacy-surface.mjs
// cannot tell "has no handshake" from "has one nobody declared", so silence
// would lock an empty surface reading as "sends credentials nowhere". This
// is the claim, stated.
const AUTH_ENDPOINTS = [];

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
// only the three actions the popup sends.

const INTERNAL_ACTIONS = new Set(["ping", "read-profile", "read-week"]);

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
    TRAIN2GO_ORIGIN,
    EXTERNAL_ACTIONS,
    INTERNAL_ACTIONS,
    AUTH_ENDPOINTS,
    ALLOWED,
    isAllowed,
    parseBody,
    handleAction,
    handleExternalMessage,
    train2goFetch,
    ping: checkSession,
    checkSession,
    readProfile,
    readWeek,
    request,
    openTrain2Go,
    persistSnapshot,
    clearSnapshot,
    TELEMETRY_KEY,
    logSwallowed,
  };
}
