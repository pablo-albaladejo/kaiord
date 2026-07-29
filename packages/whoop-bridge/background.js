/**
 * Kaiord WHOOP Bridge — Background Service Worker
 *
 * Piggybacks the user's logged-in app.whoop.com session (same model as
 * garmin-bridge). It captures the session bearer the WHOOP web app attaches to
 * its own api.prod.whoop.com requests, holds it in memory-only session storage,
 * and relays read requests to the content script inside the WHOOP tab so the
 * fetch carries that tab's origin. No OAuth, no developer app, no credentials.
 *
 * The token is never logged and is never returned to the SPA; it leaves the
 * extension only as the Authorization header of an allowlisted read back to
 * WHOOP. getSessionStatus() does expose the decoded numeric user id and the
 * capture timestamp alongside the boolean `connected` flag — all three are
 * disclosed in privacy-justification.md and the published privacy policy.
 */

const PROTOCOL_VERSION = 1;
const APP_PATTERN = "https://app.whoop.com/*";
const API_PATTERN = "https://api.prod.whoop.com/*";
const WHOOP_DASHBOARD = "https://app.whoop.com/";

const BRIDGE_MANIFEST = {
  id: "whoop-bridge",
  name: "WHOOP",
  version: "10.0.0",
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
 * Internal only — deliberately absent from EXTERNAL_ACTIONS. The SPA has no
 * use for it, and adding a field to the externally reachable `status` payload
 * would widen what this bridge discloses beyond privacy-justification.md.
 */
const hasWhoopTab = async () => ({ open: (await findWhoopTab()) !== null });

// ── Actions ──

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
      // Manifest identity keys are spread LAST so they win on collision and
      // no upstream value can spoof the bridge identity.
      return { ...(await getSessionStatus()), ...BRIDGE_MANIFEST };
    case "status":
      return getSessionStatus();
    case "capture-token":
      await storeToken(message.token);
      return { captured: true };
    case "open-whoop":
      await openWhoop();
      return null;
    case "tab-open":
      return hasWhoopTab();
    case "whoop-fetch":
      if (!message.path) throw new Error("Missing path");
      return whoopFetch(message.path);
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
//
// Web callers get a reduced action surface (reads + status only). Token capture
// stays internal (content script / popup). The sender origin is pinned by the
// vendored guard as a second layer over the manifest's externally_connectable.
const EXTERNAL_ACTIONS = new Set(["ping", "status", "whoop-fetch"]);

// No credential handshake: this bridge mints nothing and exchanges nothing.
// It piggybacks the page's own session — inject-main.js captures an
// Authorization header the WHOOP app already sends — and every read it
// then performs goes through content.js's `isAllowed` prefix gate, so the
// whole network surface is already ALLOWED_PREFIXES.
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
  chrome.runtime.onMessage.addListener((message, _sender, respond) =>
    dispatch(message, respond)
  );
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
    openWhoop,
    hasWhoopTab,
    handleAction,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
    AUTH_ENDPOINTS,
    reinjectContentScripts,
  };
}
