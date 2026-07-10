/**
 * Kaiord WHOOP Bridge — Background Service Worker
 *
 * Owns the WHOOP OAuth lifecycle (via whoop-oauth.js) and relays authorized
 * reads to the SPA. Unlike garmin-bridge (which piggybacks a web session), the
 * WHOOP data API has no browser session — the extension holds the confidential
 * client, so host_permissions on api.prod.whoop.com bypass CORS and the
 * background performs the fetch directly.
 *
 * Message envelope matches the shared bridge contract:
 *   { ok, protocolVersion, data? , error?, status?, retryable?, needsReauth? }
 */

const PROTOCOL_VERSION = 1;
const API_BASE = "https://api.prod.whoop.com/developer";

const BRIDGE_MANIFEST = {
  id: "whoop-bridge",
  name: "WHOOP",
  version: "0.1.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:body", "read:sleep"],
};

// Read-only allowlist (adapter-contracts: path/method allowlist in the fetch
// layer). Every WHOOP path kaiord reads is a GET under one of these prefixes.
const ALLOWED_PREFIXES = [
  "/v2/recovery",
  "/v2/activity/sleep",
  "/v2/cycle",
  "/v2/user/profile",
];

// ── whoop-oauth.js (importScripts in the worker, require() in tests) ──
let createWhoopAuth;
try {
  importScripts("whoop-oauth.js");
  createWhoopAuth = globalThis.createWhoopAuth;
} catch {
  createWhoopAuth =
    typeof require !== "undefined"
      ? require("./whoop-oauth.js").createWhoopAuth
      : undefined;
}

// ── Shared envelope/dispatch (vendored bridge-core) ──
let bridgeEnvelope;
try {
  importScripts("bridge-envelope.js");
  bridgeEnvelope = globalThis;
} catch {
  bridgeEnvelope =
    typeof require !== "undefined" ? require("./bridge-envelope.js") : {};
}

// ── chrome.storage.local promise wrapper ──
const storage = {
  get: (keys) => chrome.storage.local.get(keys),
  set: (obj) => chrome.storage.local.set(obj),
  remove: (keys) => chrome.storage.local.remove(keys),
};

const launchWebAuthFlow = (details) =>
  new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(details, (redirect) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!redirect) {
        reject(new Error("Authorization was cancelled"));
      } else {
        resolve(redirect);
      }
    });
  });

const auth = createWhoopAuth({
  storage,
  fetchFn: (...args) => fetch(...args),
  getRedirectURL: () => chrome.identity.getRedirectURL(),
  launchWebAuthFlow,
});

// ── Data relay ──

// Normalize before checking so `..` segments cannot escape the allowlist
// (the URL parser collapses dot-segments the same way fetch will).
const isAllowedPath = (path) => {
  let normalized;
  try {
    normalized = new URL(path, "https://x").pathname;
  } catch {
    return false;
  }
  return ALLOWED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
};

const rateLimitError = (res) => {
  const reset = Number(res.headers.get("X-RateLimit-Reset")) || undefined;
  const err = new Error("WHOOP rate limit reached");
  err.status = 429;
  err.retryable = true;
  err.resetSeconds = reset;
  return err;
};

const whoopFetch = async (path) => {
  if (!isAllowedPath(path)) throw new Error(`Path not allowed: ${path}`);
  const request = async (token) =>
    fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

  let res = await request(await auth.getAccessToken());
  if (res.status === 401) {
    res = await request(await auth.refreshAccessToken());
    if (res.status === 401) {
      // A freshly refreshed token was still rejected — surface it as a
      // reauth condition instead of a generic request failure.
      const err = new Error("WHOOP authorization required");
      err.status = 401;
      err.needsReauth = true;
      throw err;
    }
  }
  if (res.status === 429) throw rateLimitError(res);
  if (!res.ok) {
    const err = new Error(`WHOOP request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  await auth.setState({ lastSyncAt: new Date().toISOString() });
  return res.json();
};

// ── Actions ──

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
      return { ...BRIDGE_MANIFEST, ...(await auth.getAuthState()) };
    case "status":
      return auth.getAuthState();
    case "set-credentials":
      if (!message.clientId || !message.clientSecret) {
        throw new Error("Missing clientId or clientSecret");
      }
      await storage.set({
        whoopCredentials: {
          clientId: message.clientId,
          clientSecret: message.clientSecret,
        },
      });
      return { hasCredentials: true };
    case "connect":
      return auth.connect();
    case "disconnect":
      return auth.disconnect();
    case "whoop-fetch":
      if (!message.path) throw new Error("Missing path");
      return whoopFetch(message.path);
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// External (web) callers get a reduced action surface: credential writes
// stay popup-only, and the sender origin is pinned by the vendored guard
// as a second layer over the manifest's externally_connectable.
const EXTERNAL_ACTIONS = new Set(["ping", "status", "connect", "whoop-fetch"]);

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
  chrome.runtime.onMessage.addListener((message, _sender, respond) =>
    dispatch(message, respond)
  );
}

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    API_BASE,
    ALLOWED_PREFIXES,
    isAllowedPath,
    handleAction,
    whoopFetch,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
    auth,
  };
}
