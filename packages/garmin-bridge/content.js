/**
 * Kaiord Garmin Bridge — Content Script
 *
 * Injected at document_start on connect.garmin.com.
 * Handles garmin-fetch messages: validates path/method against allowlist,
 * executes fetch with session cookies, returns structured response.
 */

// Capture pristine fetch before page scripts can monkey-patch it
const nativeFetch = fetch.bind(globalThis);

const GC_API = "/gc-api";
const FETCH_TIMEOUT_MS = 30000;

const ALLOWED = [
  { method: "GET", pattern: /^\/workout-service\/workouts(\?.*)?$/ },
  { method: "POST", pattern: /^\/workout-service\/workout$/ },
];

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) =>
      rule.method === (method || "GET") && rule.pattern.test(path),
  );

const handleGarminFetch = async (msg) => {
  const { path, method, body, csrfToken } = msg;

  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }

  const url = `${GC_API}${path}`;
  const headers = {
    nk: "NT",
    "x-requested-with": "XMLHttpRequest",
  };
  if (csrfToken) headers["connect-csrf-token"] = csrfToken;
  if (body) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const r = await nativeFetch(url, {
      method: method || "GET",
      headers,
      credentials: "include",
      signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (r.status === 204) {
      return { ok: true, status: 204, data: null };
    }

    if (r.ok) {
      const data = await r.json();
      return { ok: true, status: r.status, data };
    }

    const text = await r.text().catch(() => "");
    return { ok: false, status: r.status, body: text.slice(0, 300) };
  } catch (e) {
    if (e.name === "AbortError") {
      return { ok: false, error: "Request timed out" };
    }
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(timer);
  }
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "garmin-fetch") {
    handleGarminFetch(msg).then(sendResponse);
    return true;
  }
});

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = { isAllowed, handleGarminFetch, ALLOWED };
}
