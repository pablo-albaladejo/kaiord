/**
 * Kaiord WHOOP Bridge — Content Script (isolated world)
 *
 * Injected at document_start on app.whoop.com alongside the MAIN-world
 * interceptor. Three jobs:
 *   1. Receive the captured bearer from inject-main.js — accepting the message
 *      ONLY when it comes from this window and the app.whoop.com origin — and
 *      relay it to the background.
 *   2. Secondary capture: scan the Cognito localStorage entry for the access
 *      token in case the interceptor missed the live request.
 *   3. Execute the reads the service worker relays (`whoop-fetch`) against
 *      the internal API from this tab's origin, and hand the answer back
 *      unread, and only a read on its own copy of the service worker's
 *      closed list.
 */

// Capture pristine fetch before page scripts can monkey-patch it.
const nativeFetch = fetch.bind(globalThis);

const WHOOP_ORIGIN = "https://app.whoop.com";
const API_BASE = "https://api.prod.whoop.com";
const FETCH_TIMEOUT_MS = 30000;

// A second closed list, equal entry for entry to the service worker's
// `ALLOWED` (pinned by test/content.test.js), so a read the worker did not
// list never leaves this tab even if the relay were reached another way.
// One entry per physical line, as in background.js.
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

const isAllowed = (method, path) =>
  typeof path === "string" &&
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

const handleWhoopFetch = async (msg) => {
  const { path, method, token } = msg;

  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await nativeFetch(`${API_BASE}${path}`, {
      headers: {
        authorization: `bearer ${token}`,
        accept: "application/json",
      },
      credentials: "include",
      signal: controller.signal,
    });
    const contentType = r.headers?.get?.("content-type") || "";
    const body = r.ok ? await r.text() : "";
    return { ok: r.ok, status: r.status, contentType, body };
  } catch (e) {
    return {
      ok: false,
      error: e.name === "AbortError" ? "Timed out" : e.message,
    };
  } finally {
    clearTimeout(timer);
  }
};

// ── Token relay (inject-main.js → background) ──

const onWindowMessage = (event) => {
  // Accept ONLY same-window messages from the WHOOP origin, so a script on
  // another frame/origin cannot inject or sniff a token.
  if (event.source !== window || event.origin !== WHOOP_ORIGIN) return;
  const data = event.data;
  if (!data || data.__whoopPoc !== "token" || !data.token) return;
  chrome.runtime.sendMessage({ action: "capture-token", token: data.token });
};

// ── Secondary capture: Cognito localStorage ──

const scanCognitoStorage = () => {
  if (typeof localStorage === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && /CognitoIdentityServiceProvider\..+\.accessToken$/.test(key)) {
        const token = localStorage.getItem(key);
        if (token) {
          chrome.runtime.sendMessage({ action: "capture-token", token });
          return token;
        }
      }
    }
  } catch {
    // localStorage may be unavailable in this context; ignore.
  }
  return null;
};

window.addEventListener("message", onWindowMessage);
scanCognitoStorage();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "whoop-fetch") {
    handleWhoopFetch(msg).then(sendResponse);
    return true;
  }
  return undefined;
});

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    ALLOWED,
    isAllowed,
    handleWhoopFetch,
    onWindowMessage,
    scanCognitoStorage,
  };
}
