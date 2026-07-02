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

const isAllowedPath = (path) =>
  ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));

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

const sendResult = (data, sendResponse) => {
  sendResponse({ ok: true, protocolVersion: PROTOCOL_VERSION, data });
};

const sendError = (err, sendResponse) => {
  sendResponse({
    ok: false,
    protocolVersion: PROTOCOL_VERSION,
    error: String(err?.message ?? err),
    ...(typeof err?.status === "number" ? { status: err.status } : {}),
    ...(err?.retryable ? { retryable: true } : {}),
    ...(err?.needsReauth ? { needsReauth: true } : {}),
    ...(typeof err?.resetSeconds === "number"
      ? { resetSeconds: err.resetSeconds }
      : {}),
  });
};

const dispatch = (message, sendResponse) => {
  handleAction(message)
    .then((data) => sendResult(data, sendResponse))
    .catch((err) => sendError(err, sendResponse));
  return true;
};

if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, _sender, respond) =>
    dispatch(message, respond)
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
    sendError,
    auth,
  };
}
