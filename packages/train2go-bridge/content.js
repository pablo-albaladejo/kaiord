/**
 * Kaiord Train2Go Bridge — Content Script
 *
 * Injected at document_start on app.train2go.com.
 * Handles train2go-fetch messages: validates path/method against allowlist,
 * executes fetch with session cookies, returns structured response.
 * Messages are received only via chrome.runtime.onMessage which restricts
 * senders to the extension's own background/popup scripts.
 */

// Capture pristine fetch before page scripts can monkey-patch it
const nativeFetch = fetch.bind(globalThis);

const FETCH_TIMEOUT_MS = 30_000;

const ALLOWED = [
  { method: "GET", pattern: /^\/api\/v2\/profile\/ping$/ },
  {
    method: "GET",
    pattern:
      /^\/api\/v2\/workplan\/weekly\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/,
  },
  {
    method: "GET",
    pattern:
      /^\/api\/v2\/workplan\/daily\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/,
  },
  { method: "GET", pattern: /^\/api\/v2\/workplan\/tooltip\/activity\/\d+$/ },
];

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

const handleFetch = async (msg) => {
  const { path, method } = msg;

  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }

  const url = `https://app.train2go.com${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const r = await nativeFetch(url, {
      method: method || "GET",
      credentials: "include",
      signal: controller.signal,
    });

    if (r.redirected) {
      return { ok: false, error: "Session expired" };
    }

    if (r.ok) {
      const data = await r.json();
      return { ok: true, status: r.status, data };
    }

    return { ok: false, status: r.status, error: "Request failed" };
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
  if (msg.action === "train2go-fetch") {
    handleFetch(msg).then(sendResponse);
    return true;
  }
});

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = { isAllowed, handleFetch, ALLOWED };
}
