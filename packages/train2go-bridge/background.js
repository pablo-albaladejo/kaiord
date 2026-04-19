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
  version: "0.1.1",
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

chrome.runtime.onMessageExternal.addListener(
  (message, _sender, sendResponse) => {
    handleAction(message)
      .then((data) => sendResult(data, sendResponse))
      .catch((err) => sendError(err, sendResponse));
    return true;
  }
);

// ── Internal messages (popup) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "train2go-fetch") return; // handled by content script
  handleAction(message)
    .then((data) => sendResult(data, sendResponse))
    .catch((err) => sendError(err, sendResponse));
  return true;
});

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    handleAction,
    findTrain2GoTab,
    train2goFetch,
    ping,
    readWeek,
    readDay,
    openTrain2Go,
  };
}
