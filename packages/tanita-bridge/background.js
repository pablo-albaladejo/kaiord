/**
 * Kaiord Tanita Bridge — Background Service Worker
 *
 * Thin Bridge (docs/adr/0004-thin-bridge-smart-connector.md): the service
 * worker lends the athlete's MyTANITA Session and executes requests from a
 * closed list of method + path patterns (`ALLOWED`), handing the Kaiord App
 * MyTANITA's raw answer. Telling an export from a login page, parsing it and
 * the mapping to KRD are the App's Tanita Connector (@kaiord/tanita runs
 * there; this bridge does not import it).
 *
 * Requests go to mytanita.eu with `credentials:"include"`, so the HttpOnly
 * `TANITASESS` session cookie travels automatically. No password, no
 * `cookies` permission, no content script on mytanita.eu. The cookie is
 * never read or exposed; a Session check answers yes or no only.
 */

// 2: the generic `request` action replaced read-export-csv for the App. The
// App accepts version 1 as well.
const PROTOCOL_VERSION = 2;
const TANITA_ORIGIN = "https://mytanita.eu";
const EXPORT_CSV_PATH = "/en/user/export-csv";

const BRIDGE_MANIFEST = {
  id: "tanita-bridge",
  name: "Tanita",
  version: "10.4.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:body"],
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

// ── Identity-free cookie transport (vendored bridge-core) ──
let sessionFetch;
try {
  importScripts("session-fetch.js");
  sessionFetch = globalThis;
} catch {
  sessionFetch =
    typeof require !== "undefined" ? require("./session-fetch.js") : {};
}

// ── The `request` gate: closed list (vendored bridge-core) ──
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

// ── Tanita call surface: the closed list ──
//
// Method + path pattern, nothing else: every request, the App's included,
// is checked against it before any fetch runs; anything else is refused
// without a request. HEAD serves the Session check. Locked against drift by
// scripts/check-bridge-privacy-surface.mjs (single-physical-line entries).
const ALLOWED = [
  { method: "GET", pattern: /^\/en\/user\/export-csv$/ },
  { method: "HEAD", pattern: /^\/en\/user\/export-csv$/ },
];

const isAllowed = (method, path) =>
  sessionFetch.isPathAllowed(ALLOWED, method, path);

// The Session check reads headers only: an HTML page in place of the export
// means MyTANITA bounced it to its login page.
const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i;

const isHtmlContentType = (contentType) =>
  HTML_CONTENT_TYPE_RE.test(contentType || "");

// ── Actions ──

// The Session check: a HEAD of the export, so MyTANITA answers with headers
// and no body. A bounce to the login page (redirect, 401/403, or an HTML page
// in place of the export) is a verified "signed-out"; any other failure means
// MyTANITA did not answer, which is never reported as signed out.
const probeExport = async () => {
  if (!isAllowed("HEAD", EXPORT_CSV_PATH)) return "not-answering";
  try {
    const response = await fetch(`${TANITA_ORIGIN}${EXPORT_CSV_PATH}`, {
      method: "HEAD",
      credentials: "include",
      redirect: "manual",
    });
    if (
      sessionFetch.isSessionRedirect(response) ||
      sessionFetch.isAuthChallenge(response)
    ) {
      return "signed-out";
    }
    if (!response.ok) return "not-answering";
    const contentType = response.headers?.get?.("content-type") || "";
    return isHtmlContentType(contentType) ? "signed-out" : "signed-in";
  } catch {
    return "not-answering";
  }
};

// Answers yes or no and nothing else: the manifest, the typed outcome and the
// legacy boolean older Kaiord Apps read. No byte of the export is read.
const checkSession = async () => {
  const session = await probeExport();
  return {
    ...BRIDGE_MANIFEST,
    session,
    authenticated: session === "signed-in",
  };
};

const toBridgeError = (res) => {
  const err = new Error(res?.error ?? "Request failed");
  if (typeof res?.status === "number") err.status = res.status;
  if (res?.needsReauth) err.needsReauth = true;
  return err;
};

// ── The App's one read: a request from the closed list, answered raw ──
const request = async (message) => {
  const { method, path } = requestGate.createRequestGate({ allowed: ALLOWED })(
    message
  );
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TANITA_ORIGIN}${path}`,
    method,
    headers: { Accept: "text/csv,*/*" },
    fetchImpl: fetch,
  });
  if (!res.ok) throw toBridgeError(res);
  return answerCore.toAnswer(res);
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
    case "checkSession":
      return await checkSession();
    case "request":
      return await request(message);
    case "set-theme":
      return await bridgeTheme.storeThemePreference(message.theme);
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
//
// Every external message is origin-pinned and action-allowlisted by the
// vendored guard as a second layer over the manifest's
// externally_connectable. `request` is reachable only here.
const EXTERNAL_ACTIONS = new Set([
  "ping",
  "checkSession",
  "request",
  "set-theme",
]);

// ── Internal messages (popup) ──
// Only the extension's own pages are answered, never a content script, and
// only the Session check the popup sends.
const INTERNAL_ACTIONS = new Set(["checkSession"]);

// No credential handshake: this bridge mints nothing and exchanges nothing.
// The MyTANITA session cookie rides along on the export fetch itself
// (`credentials:"include"` in session-fetch.js), and that fetch is gated by
// `isAllowed` above — so the whole network surface is already ALLOWED.
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
    TANITA_ORIGIN,
    EXPORT_CSV_PATH,
    ALLOWED,
    isAllowed,
    isHtmlContentType,
    request,
    checkSession,
    handleAction,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
    INTERNAL_ACTIONS,
    AUTH_ENDPOINTS,
  };
}
