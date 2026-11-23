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
 *      unread. The closed list of paths is the service worker's `ALLOWED`;
 *      this script only refuses anything that is not a GET of an API path.
 */

// Capture pristine fetch before page scripts can monkey-patch it.
const nativeFetch = fetch.bind(globalThis);

const WHOOP_ORIGIN = "https://app.whoop.com";
const API_BASE = "https://api.prod.whoop.com";
const FETCH_TIMEOUT_MS = 30000;

// A second, coarse check under the service worker's closed list: a GET of a
// path on the API host, never another host or a scheme-relative URL.
const isAllowed = (method, path) => {
  if ((method || "GET").toUpperCase() !== "GET") return false;
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  try {
    return new URL(path, API_BASE).origin === API_BASE;
  } catch {
    return false;
  }
};

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
    isAllowed,
    handleWhoopFetch,
    onWindowMessage,
    scanCognitoStorage,
  };
}
