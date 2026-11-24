/**
 * Kaiord WHOOP Bridge — Background Service Worker
 *
 * Thin Bridge (docs/adr/0004-thin-bridge-smart-connector.md): the service
 * worker lends the athlete's WHOOP Session and executes requests from a
 * closed list of method + path patterns (`ALLOWED`), handing the Kaiord App
 * WHOOP's raw answer. What to ask for, how to read it and the mapping to KRD
 * are the App's WHOOP Connector (@kaiord/whoop runs there).
 *
 * Piggybacks the athlete's logged-in app.whoop.com session: it captures the
 * session bearer the WHOOP web app attaches to its own api.prod.whoop.com
 * requests, holds it in memory-only session storage, and relays each listed
 * read to the content script inside the open WHOOP tab so the fetch carries
 * that tab's origin. No OAuth, no developer app, no credentials.
 *
 * The token is never logged and is never returned to the App; it leaves the
 * service worker only for the WHOOP tab, as the Authorization header of a
 * listed read back to WHOOP. The popup's status read (internal only) shows
 * the decoded numeric user id and the capture time.
 */

// 2: the generic `request` action replaced whoop-fetch for the App. The App
// accepts version 1 as well.
const PROTOCOL_VERSION = 2;
const APP_PATTERN = "https://app.whoop.com/*";
const API_PATTERN = "https://api.prod.whoop.com/*";
const WHOOP_DASHBOARD = "https://app.whoop.com/";

const BRIDGE_MANIFEST = {
  id: "whoop-bridge",
  name: "WHOOP",
  version: "10.4.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:body", "read:sleep", "read:activities"],
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

// ── The personal fields no Connector reads, removed from every answer ──
let personalFields;
try {
  importScripts("personal-fields.js");
  personalFields = globalThis.bridgePersonalFields;
} catch {
  personalFields =
    typeof require !== "undefined" ? require("./personal-fields.js") : {};
}

// ── WHOOP call surface: the closed list ──
//
// Method + path pattern, nothing else, GET only: every request is checked
// against it before it is relayed to the WHOOP tab; anything else is refused
// without a request. Queries are the exact ones the App's Connector builds
// (ISO times percent-encoded). Locked against drift by
// scripts/check-bridge-privacy-surface.mjs (one entry per physical line).
const ALLOWED = [
  // prettier-ignore
  { method: "GET", pattern: /^\/core-details-bff\/v0\/cycles\/details\?id=\d+&startTime=[\w%.-]+&endTime=[\w%.-]+$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/metrics-service\/v1\/metrics\/user\/\d+\?name=heart_rate&start=[\w%.-]+&end=[\w%.-]+&step=\d+$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/activities-service\/v1\/sports\/history\?countryCode=[A-Z]{2}$/ },
  { method: "GET", pattern: /^\/advanced-labs-service\/v1\/biomarker-tests$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/advanced-labs-service\/v1\/biomarker-tests\/[\w-]+\/summary$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/health-service\/v2\/stress-bff\/\d{4}-\d{2}-\d{2}$/ },
];

// ── Session bearer capture ──
//
// The internal API authenticates with a Cognito bearer JWT (not cookies). We
// hold it in chrome.storage.session (memory-only, survives SW restart, never
// logged) and decode the numeric `custom:user_id` claim every path needs.

const decodeUserId = (jwt) => {
  try {
    const seg = String(jwt).split(".")[1];
    if (!seg) return null;
    let b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64));
    const raw = payload["custom:user_id"];
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

const SESSION_KEYS = ["whoopToken", "whoopUserId", "whoopCapturedAt"];

const storeToken = async (token) => {
  if (!token || typeof token !== "string") return;
  await chrome.storage.session.set({
    whoopToken: token,
    whoopUserId: decodeUserId(token),
    whoopCapturedAt: Date.now(),
  });
};

// Secondary capture path: read the header via webRequest in case the
// content-script interceptor missed the live request.
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const auth = details.requestHeaders?.find(
      (h) => h.name.toLowerCase() === "authorization"
    );
    if (auth?.value && /^bearer\s/i.test(auth.value)) {
      const token = auth.value.replace(/^bearer\s/i, "").trim();
      void storeToken(token);
    }
  },
  { urls: [API_PATTERN] },
  ["requestHeaders", "extraHeaders"]
);

// Read session keys individually so the wrapper works against both the real
// chrome.storage.session (which supports array reads) and the vendored test
// mock (which resolves a single string key per call).
const getSession = async () => {
  const parts = await Promise.all(
    SESSION_KEYS.map((key) => chrome.storage.session.get(key))
  );
  return Object.assign({}, ...parts);
};

const getSessionStatus = async () => {
  const session = await getSession();
  return {
    connected: !!session.whoopToken,
    userId: session.whoopUserId ?? null,
    capturedAt: session.whoopCapturedAt ?? null,
  };
};

// The Session check: reads chrome.storage.session and makes no request. A
// bearer captured from WHOOP's own traffic is "signed-in"; none captured yet
// is "not-checked" (the WHOOP tab has not sent a request since the service
// worker started), never signed out. Only yes or no leaves: no id, no time.
// `hasAccountId` and `tabOpen` say whether a held sign-in can serve a read,
// so the Kaiord App shows the popup's notice at the same moment.
const checkSession = async () => {
  const { connected, userId } = await getSessionStatus();
  return {
    connected,
    session: connected ? "signed-in" : "not-checked",
    authenticated: connected,
    hasAccountId: connected && userId !== null,
    tabOpen: (await findWhoopTab()) !== null,
  };
};

// The WHOOP id every read path is built on, read when the Kaiord App is about
// to import.
const readUserId = async () => {
  const { connected, userId } = await getSessionStatus();
  if (!connected || userId === null) {
    throw new Error(
      "no session token captured — open app.whoop.com and reload it"
    );
  }
  return { userId };
};

// ── Tab relay ──

const findWhoopTab = () =>
  new Promise((resolve) => {
    chrome.tabs.query({ url: APP_PATTERN }, (tabs) =>
      resolve(tabs?.[0] ?? null)
    );
  });

const whoopFetch = async (path) => {
  const { whoopToken } = await getSession();
  if (!whoopToken) {
    throw new Error(
      "no session token captured — open app.whoop.com and reload it"
    );
  }
  const tab = await findWhoopTab();
  if (!tab) throw new Error("No app.whoop.com tab open.");

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "whoop-fetch", path, token: whoopToken },
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

const openWhoop = async () => {
  await chrome.tabs.create({ url: WHOOP_DASHBOARD });
};

/**
 * Whether an app.whoop.com tab is open right now.
 *
 * `connected` alone cannot answer "is Kaiord able to read?": the bearer lives
 * in chrome.storage.session and outlives the tab it was captured from, while
 * every read is executed BY that tab (whoopFetch → findWhoopTab → the content
 * script's own-origin fetch). With the token held and no tab open, the popup
 * would otherwise report a healthy session over reads that all throw.
 *
 * Internal only: the Kaiord App learns the same yes or no from the
 * `tabOpen` of its Session check, never which tab it is.
 */
const hasWhoopTab = async () => ({ open: (await findWhoopTab()) !== null });

const UNAUTHORIZED_STATUS = 401;

// ── The App's one read: a request from the closed list, answered raw ──
// Run by the content script in the open WHOOP tab, which hands back the
// answer unread.
const request = async (message) => {
  const { path } = requestGate.createRequestGate({ allowed: ALLOWED })(message);
  const res = await whoopFetch(path);
  // A 401 is WHOOP refusing the captured bearer: a verified sign-out.
  if (!res?.ok) {
    throw answerCore.toBridgeError({
      ...res,
      needsReauth: res?.status === UNAUTHORIZED_STATUS,
    });
  }
  return answerCore.toAnswer(res, personalFields);
};

// ── Actions ──

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
      // Manifest identity keys are spread LAST so they win on collision and
      // no upstream value can spoof the bridge identity.
      return { ...(await checkSession()), ...BRIDGE_MANIFEST };
    case "status":
      return checkSession();
    case "popup-status":
      return getSessionStatus();
    case "read-user-id":
      return readUserId();
    case "open-whoop":
      await openWhoop();
      return null;
    case "tab-open":
      return hasWhoopTab();
    case "request":
      return request(message);
    case "set-theme":
      return await bridgeTheme.storeThemePreference(message.theme);
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
//
// Web callers get a reduced action surface (the request, status, the id the
// read paths are built on, and the app's theme preference for the popup).
// Token capture stays internal (the WHOOP tab's content script). The sender
// origin is pinned by the vendored guard as a second layer over the
// manifest's externally_connectable. `request` is reachable only here.
const EXTERNAL_ACTIONS = new Set([
  "ping",
  "status",
  "read-user-id",
  "request",
  "set-theme",
]);

// ── Internal messages ──
// The popup's two reads, answered only to the extension's own pages, never a
// content script.
const INTERNAL_ACTIONS = new Set(["popup-status", "tab-open"]);

// The bearer the WHOOP tab's content script captured: taken only from this
// extension's own content script running on app.whoop.com, stored, and never
// answered, so no page and no other content script learns anything from it.
const WHOOP_ORIGIN = "https://app.whoop.com";

const isWhoopContentScript = (sender) =>
  sender?.id === chrome.runtime.id &&
  !!sender?.tab &&
  sender?.origin === WHOOP_ORIGIN;

const captureTokenListener = (message, sender) => {
  if (message?.action !== "capture-token" || !isWhoopContentScript(sender)) {
    return false;
  }
  void storeToken(message.token);
  return false;
};

// No credential handshake: this bridge mints nothing and exchanges nothing.
// It piggybacks the page's own session — inject-main.js captures an
// Authorization header the WHOOP app already sends — and every read it
// then performs goes through the `request` gate above, so the whole network
// surface is already ALLOWED.
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
  chrome.runtime.onMessage.addListener(captureTokenListener);
}

// ── Content-script re-inject after extension reload ──
//
// Chrome terminates content scripts in existing tabs when the extension is
// reloaded but does NOT re-inject them, leaving stale dead listeners. Re-inject
// programmatically on onInstalled so app.whoop.com tabs keep working without a
// manual reload. Only scripts whose match patterns are covered by
// host_permissions are re-injected; kaiord-announce.js on the SPA origin is out
// of scope (kept as the standard MV3 dev flow).
const reinjectContentScripts = async () => {
  const manifest = chrome.runtime.getManifest();
  const hostPermissions = manifest.host_permissions ?? [];
  for (const script of manifest.content_scripts ?? []) {
    const matches = (script.matches ?? []).filter((m) =>
      hostPermissions.includes(m)
    );
    if (matches.length === 0) continue;
    const tabs = await chrome.tabs.query({ url: matches });
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: !!script.all_frames },
          files: script.js,
          ...(script.world ? { world: script.world } : {}),
        });
      } catch {
        // Tab may be restricted or already injected; ignore.
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
    APP_PATTERN,
    API_PATTERN,
    decodeUserId,
    storeToken,
    getSession,
    getSessionStatus,
    findWhoopTab,
    whoopFetch,
    request,
    ALLOWED,
    captureTokenListener,
    openWhoop,
    hasWhoopTab,
    handleAction,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
    INTERNAL_ACTIONS,
    AUTH_ENDPOINTS,
    reinjectContentScripts,
  };
}
