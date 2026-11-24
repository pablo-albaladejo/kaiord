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
  name: "Train2Go",
  version: "10.4.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:training-plan", "read:training-zones", "read:body"],
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

// The popup's own reader and the snapshot validator, then the vendored
// bridge-core: envelope/dispatch, the popup's theme, the cookie transport,
// the `request` gate and the answer handed to the App.
const parser = loadScript("parser.js");
const snapshotValidator = loadScript("profile-snapshot.js");
const bridgeEnvelope = loadScript("bridge-envelope.js");
const bridgeTheme = loadScript("bridge-theme.js");
const sessionFetch = loadScript("session-fetch.js");
const requestGate = loadScript("bridge-request-gate.js", "bridgeRequestGate");
const answerCore = loadScript("bridge-answer.js", "bridgeAnswer");
const personalFields = loadScript("personal-fields.js", "bridgePersonalFields");

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

// Train2Go's own "Unauthenticated" answer to the profile ping
// (test/fixtures/ping-expired.json): a failure that names the sign-in.
const SIGNED_OUT_REDIRECT = /^\/login\b/;
const SIGNED_OUT_ERROR = /^unauthenticated\.?$/i;

const saysUnauthenticated = (data) =>
  data?.success === false &&
  (SIGNED_OUT_REDIRECT.test(String(data.redirect ?? "")) ||
    SIGNED_OUT_ERROR.test(String(data.message ?? "")) ||
    (Array.isArray(data.errors) &&
      data.errors.some((e) => SIGNED_OUT_ERROR.test(String(e)))));

// The typed outcome of one profile-ping answer, shared by the Session check
// and the popup's profile read so both word one answer the same way.
// Signed in when the ping succeeds and names a user: a yes or no, read here
// without the popup's parser, so the Session check reaches no popup read.
const pingNamesUser = (data) =>
  data?.success === true && Boolean(data?.data?.user);

const sessionOutcomeOf = (res) => {
  if (res?.ok) {
    if (pingNamesUser(res.data)) return "signed-in";
    return saysUnauthenticated(res.data) ? "signed-out" : "not-answering";
  }
  return res?.needsReauth ? "signed-out" : "not-answering";
};

// The Session check, answered to `ping`: one GET of the profile ping, the
// cheapest Train2Go request that tells a live session from a dead one. Only
// the outcome leaves the service worker; the profile in the body is dropped
// here. Train2Go saying the session is gone (a redirect to its sign-in page,
// a 401, or its "Unauthenticated" ping body) is a verified "signed-out";
// anything else that fails, a 403 included, is "not-answering", never signed
// out.
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

// Popup only (internal channel): the inputs of its weekly figures.
const readWeek = async (date, userId) => {
  const path = `/api/v2/workplan/weekly/${date}?user=${userId}`;
  const res = await train2goFetch(path);
  if (!res?.ok) throw answerCore.toBridgeError(res, "Read week failed");

  const html = res.data?.data?.replace?.["#workplan"] ?? "";
  return { activities: parser.parseWeeklyHtml(html) };
};

// ── The App's one read: a request from the closed list, answered raw ──
// The vendored gate admits only `method` and `path` of a listed entry; no
// entry declares a body, so a body (or any other key) is refused unsent.
const request = async (message) => {
  const { method, path } = requestGate.createRequestGate({ allowed: ALLOWED })(
    message
  );
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TRAIN2GO_ORIGIN}${path}`,
    method,
    fetchImpl: fetch,
  });
  if (!res.ok) throw answerCore.toBridgeError(res);
  return answerCore.toAnswer(res, personalFields);
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

// ADR 0004's bounded exception: the internal actions that read and interpret
// Train2Go data for the popup alone, when the athlete opens it, through the
// closed list, never stored and never handed to the App, and the script only
// they use. Checked by scripts/check-bridge-popup-reads.mjs.
const POPUP_READS = new Set(["read-profile", "read-week"]);
const POPUP_READ_SCRIPTS = ["parser.js"];

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
    POPUP_READS,
    POPUP_READ_SCRIPTS,
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
