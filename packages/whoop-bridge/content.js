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
 *   3. Execute background-relayed `whoop-fetch` reads against the internal API
 *      from this tab's origin, enforcing a read-only GET allowlist.
 */

// Capture pristine fetch before page scripts can monkey-patch it.
const nativeFetch = fetch.bind(globalThis);

const WHOOP_ORIGIN = "https://app.whoop.com";
const API_BASE = "https://api.prod.whoop.com";
const FETCH_TIMEOUT_MS = 30000;

// Read-only allowlist of internal-API prefixes (design D3). Every WHOOP path
// kaiord reads is a GET under one of these. Prefixes ending in "/" match any
// sub-path; the others match the exact path or an explicit sub-path segment so
// a look-alike like ".../detailsX" cannot slip through.
const ALLOWED_PREFIXES = [
  "/core-details-bff/v0/cycles/details",
  "/metrics-service/v1/metrics/user/",
  "/activities-service/v1/sports/history",
  "/advanced-labs-service/v1/biomarker-tests",
  "/health-service/v2/stress-bff",
];

const matchesPrefix = (pathname, prefix) =>
  prefix.endsWith("/")
    ? pathname.startsWith(prefix)
    : pathname === prefix || pathname.startsWith(`${prefix}/`);

const isAllowed = (method, path) => {
  if ((method || "GET").toUpperCase() !== "GET") return false;
  let pathname;
  try {
    // Parse against a dummy base so `..` segments are collapsed the same way
    // fetch will and the query string is dropped before the prefix check.
    pathname = new URL(path, "https://x").pathname;
  } catch {
    return false;
  }
  return ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
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
    const text = await r.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text.slice(0, 500);
    }
    return { ok: r.ok, status: r.status, data };
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
    ALLOWED_PREFIXES,
  };
}
