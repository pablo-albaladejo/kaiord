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

// One-entry-per-line is required by the privacy-surface guard
// (`scripts/check-bridge-privacy-surface.mjs`) which parses
// `method: "..."` and `pattern: /.../` off the same line. Don't let
// prettier wrap these — the long regexes are flagged with the
// disable-next-line so the line stays single-physical.
const ALLOWED = [
  { method: "GET", pattern: /^\/api\/v2\/profile\/ping$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/api\/v2\/workplan\/weekly\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/api\/v2\/workplan\/daily\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/ },
  { method: "GET", pattern: /^\/api\/v2\/workplan\/tooltip\/activity\/\d+$/ },
  // Server-rendered HTML page used by the zones-sync feature; data is
  // extracted by parseDetailsHtml on the bridge background side.
  { method: "GET", pattern: /^\/user\/details$/ },
];

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

// Reads the response body dispatching by Content-Type. Falls back to
// JSON when headers are unavailable (legacy test mocks). Extracted so
// handleFetch stays under the 40-line file-cap.
const readBody = (r) => {
  const ct =
    (r.headers && typeof r.headers.get === "function"
      ? r.headers.get("content-type")
      : "") || "";
  return /^text\/html\b/i.test(ct) ? r.text() : r.json();
};

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
      const data = await readBody(r);
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
