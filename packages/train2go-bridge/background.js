/**
 * Kaiord Train2Go Bridge — Background Service Worker
 *
 * Routes messages between SPA ↔ content script on app.train2go.com.
 * Parses Train2Go HTML responses into structured activity data.
 */

const PROTOCOL_VERSION = 1;
const TRAIN2GO_URL_PATTERN = "https://app.train2go.com/*";
const TRAIN2GO_DASHBOARD = "https://app.train2go.com/user/index";

const BRIDGE_MANIFEST = {
  id: "train2go-bridge",
  name: "Kaiord Train2Go Bridge",
  version: "7.1.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:training-plan"],
};

// ── Parser (loaded inline for service worker) ──
// In the extension, parser.js is loaded via importScripts or inlined.
// For testing, it's required via module.exports.
let parser;
try {
  importScripts("parser.js");
  parser = globalThis;
} catch {
  parser = typeof require !== "undefined" ? require("./parser.js") : {};
}

let snapshotValidator;
try {
  importScripts("profile-snapshot.js");
  snapshotValidator = globalThis;
} catch {
  snapshotValidator =
    typeof require !== "undefined" ? require("./profile-snapshot.js") : {};
}

const SNAPSHOT_ACTIONS = new Set([
  "profile-snapshot",
  "profile-snapshot-clear",
]);

// ── Tab helpers ──

const findTrain2GoTab = () =>
  new Promise((resolve) => {
    chrome.tabs.query({ url: TRAIN2GO_URL_PATTERN }, (tabs) => {
      resolve(tabs?.[0] ?? null);
    });
  });

// ── Content script messaging ──

const train2goFetch = async (path) => {
  const tab = await findTrain2GoTab();
  if (!tab) {
    throw new Error("No Train2Go tab open. Open app.train2go.com first.");
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "train2go-fetch", path, method: "GET" },
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

// ── Actions ──

let lastPingedUserId = null;

// Spread session FIRST, then BRIDGE_MANIFEST, so manifest fields
// (id/name/version/protocolVersion/capabilities) cannot be spoofed by
// a future Train2Go API change that returns its own keys with the same
// names. This matches the garmin-bridge precedence and is enforced by
// the "manifest fields take precedence" test.
const ping = async () => {
  try {
    const res = await train2goFetch("/api/v2/profile/ping");
    if (!res?.ok) {
      return { ...BRIDGE_MANIFEST, sessionActive: false };
    }
    const session = parser.parsePingJson(res.data);
    if (session.userId) lastPingedUserId = session.userId;
    return {
      ...session,
      ...BRIDGE_MANIFEST,
      sessionActive: session.sessionActive,
      userId: session.userId,
      userName: session.userName,
    };
    // session may also carry coachName / notes — both are spread above
    // and only the BRIDGE_MANIFEST keys are explicitly overwritten.
  } catch {
    return { ...BRIDGE_MANIFEST, sessionActive: false };
  }
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  return err;
};

const readWeek = async (date, userId) => {
  const path = `/api/v2/workplan/weekly/${date}?user=${userId}`;
  const res = await train2goFetch(path);
  if (!res?.ok) throw toBridgeError("Read week failed", res);

  const html = res.data?.data?.replace?.["#workplan"] ?? "";
  return { activities: parser.parseWeeklyHtml(html) };
};

const readDay = async (date, userId) => {
  const path = `/api/v2/workplan/daily/${date}?user=${userId}&source=sidebar`;
  const res = await train2goFetch(path);
  if (!res?.ok) throw toBridgeError("Read day failed", res);

  const html = res.data?.data?.content ?? "";
  return { activities: parser.parseDailyHtml(html) };
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
      return await ping();
    case "read-week":
      if (!message.userId) throw new Error("Missing userId");
      return await readWeek(message.date, message.userId);
    case "read-day":
      if (!message.userId) throw new Error("Missing userId");
      return await readDay(message.date, message.userId);
    case "open-train2go":
      await openTrain2Go();
      return null;
    case "profile-snapshot":
      return await persistSnapshot(message.snapshot);
    case "profile-snapshot-clear":
      return await clearSnapshot();
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

const sendResult = (data, sendResponse) => {
  sendResponse({
    ok: true,
    protocolVersion: PROTOCOL_VERSION,
    data,
  });
};

const sendError = (err, sendResponse) => {
  sendResponse({
    ok: false,
    protocolVersion: PROTOCOL_VERSION,
    error: String(err?.message ?? err),
    ...(typeof err?.status === "number" ? { status: err.status } : {}),
  });
};

// ── External messages (SPA ↔ Extension) ──

const handleExternalMessage = (message, sender, sendResponse) => {
  if (
    SNAPSHOT_ACTIONS.has(message?.action) &&
    !snapshotValidator.isAllowedSenderOrigin(sender)
  ) {
    sendResponse({
      ok: false,
      protocolVersion: PROTOCOL_VERSION,
      error: "Origin not permitted",
      retryable: false,
    });
    return true;
  }
  handleAction(message)
    .then((data) => sendResult(data, sendResponse))
    .catch((err) => sendError(err, sendResponse));
  return true;
};

chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

// ── Internal messages (popup) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "train2go-fetch") return; // handled by content script
  handleAction(message)
    .then((data) => sendResult(data, sendResponse))
    .catch((err) => sendError(err, sendResponse));
  return true;
});

// ── Content-script re-inject after extension reload ──
//
// When the extension is reloaded (DevTools, update, install), Chrome
// terminates content scripts in existing tabs but does NOT re-inject
// them automatically. Tabs that were already open at app.train2go.com
// keep stale, dead listeners — chrome.tabs.sendMessage to them fails
// with "Receiving end does not exist", and the bridge's `train2goFetch`
// silently returns sessionActive: false. Re-inject programmatically on
// onInstalled so the user does not have to reload every Train2Go tab
// after touching the extension.
//
// Only patterns covered by `host_permissions` are re-injected.
// `kaiord-announce.js` runs on `*.kaiord.com` (production) and on
// `localhost` in dev — those are NOT in host_permissions, so the SPA
// tab still needs a manual reload after a bridge update. That is the
// standard MV3 dev experience and out of scope for this fix.
const reinjectContentScripts = async () => {
  const manifest = chrome.runtime.getManifest();
  const hostPermissions = manifest.host_permissions ?? [];
  for (const script of manifest.content_scripts ?? []) {
    const matches = script.matches.filter((m) => hostPermissions.includes(m));
    if (matches.length === 0) continue;
    const tabs = await chrome.tabs.query({ url: matches });
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: !!script.all_frames },
          files: script.js,
        });
      } catch {
        // Tab may be in a restricted context or already injected; ignore.
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
    handleAction,
    handleExternalMessage,
    findTrain2GoTab,
    train2goFetch,
    ping,
    readWeek,
    readDay,
    openTrain2Go,
    persistSnapshot,
    clearSnapshot,
    reinjectContentScripts,
  };
}
