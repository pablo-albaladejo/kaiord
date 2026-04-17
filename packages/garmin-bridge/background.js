/**
 * Kaiord Garmin Bridge — Background Service Worker
 *
 * Captures CSRF token via webRequest, coordinates messaging between
 * SPA ↔ background ↔ content script on connect.garmin.com.
 */

const PROTOCOL_VERSION = 1;
const GARMIN_URL_PATTERN = "https://connect.garmin.com/*";
const GARMIN_DASHBOARD = "https://connect.garmin.com/modern/";

const BRIDGE_MANIFEST = {
  id: "garmin-bridge",
  name: "Garmin Connect",
  version: "0.1.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["write:workouts"],
};

// ── CSRF token capture ──

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const header = details.requestHeaders?.find(
      (h) => h.name.toLowerCase() === "connect-csrf-token"
    );
    if (header?.value) {
      chrome.storage.session.set({ csrfToken: header.value });
    }
  },
  { urls: [GARMIN_URL_PATTERN] },
  ["requestHeaders"]
);

const getCsrfToken = () =>
  chrome.storage.session.get("csrfToken").then((r) => r.csrfToken ?? null);

// ── Tab helpers ──

const findGarminTab = () =>
  new Promise((resolve) => {
    chrome.tabs.query({ url: GARMIN_URL_PATTERN }, (tabs) => {
      resolve(tabs?.[0] ?? null);
    });
  });

// ── Content script messaging ──

const garminFetch = async (path, method, body) => {
  const tab = await findGarminTab();
  if (!tab) {
    throw new Error(
      "No Garmin Connect tab open. Open connect.garmin.com first."
    );
  }

  const csrfToken = await getCsrfToken();

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "garmin-fetch", path, method, body, csrfToken },
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

/**
 * Ping handler. Response data shape:
 *   BridgeManifest ∪ { csrfCaptured: boolean, gcApi: object }
 *
 * Manifest keys (id, name, version, protocolVersion, capabilities) take
 * precedence on collision. The SPA's bridge-registry parses only the
 * BridgeManifest fields via `bridgeManifestSchema.safeParse(data)`;
 * extra fields are stripped by Zod so the session-status fields remain
 * available to popup/UI consumers without affecting registration.
 */
const checkSession = async () => {
  const csrfToken = await getCsrfToken();
  const results = { ...BRIDGE_MANIFEST, csrfCaptured: csrfToken !== null };

  try {
    const res = await garminFetch(
      "/workout-service/workouts?start=0&limit=1",
      "GET"
    );
    results.gcApi = res;
  } catch (e) {
    results.gcApi = { ok: false, error: e.message };
  }

  return results;
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  return err;
};

const listWorkouts = async () => {
  const res = await garminFetch(
    "/workout-service/workouts?start=0&limit=20",
    "GET"
  );
  if (!res?.ok) throw toBridgeError("List failed", res);
  return res.data;
};

const pushWorkout = async (gcn) => {
  const res = await garminFetch("/workout-service/workout", "POST", gcn);
  if (!res?.ok) throw toBridgeError("Push failed", res);
  return res.data;
};

const openGarmin = async () => {
  await chrome.tabs.create({ url: GARMIN_DASHBOARD });
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
      return await checkSession();
    case "list":
      return await listWorkouts();
    case "push":
      if (!message.gcn) throw new Error("Missing gcn payload");
      return await pushWorkout(message.gcn);
    case "open-garmin":
      await openGarmin();
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
    getCsrfToken,
    findGarminTab,
    garminFetch,
    checkSession,
    listWorkouts,
    pushWorkout,
    openGarmin,
  };
}
