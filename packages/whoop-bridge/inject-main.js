/**
 * Kaiord WHOOP Bridge — main-world interceptor.
 *
 * Runs in the page's own JS world (world: MAIN) at document_start, before
 * WHOOP's app code. Wraps fetch + XHR.setRequestHeader so it can read the
 * `Authorization: bearer` header WHOOP attaches to its own api.prod.whoop.com
 * calls, then hands the token to the isolated content script via
 * window.postMessage (MAIN world has no chrome.* APIs of its own).
 *
 * The handoff is origin-pinned: the message is posted to the exact page origin
 * (https://app.whoop.com), never "*", so another script on the page cannot
 * receive the token by listening on a wildcard.
 */

const TARGET_ORIGIN = "https://app.whoop.com";

let lastSentToken = null;

// Test seam: reset the dedupe latch between cases.
const resetDedup = () => {
  lastSentToken = null;
};

const extractBearer = (value) => {
  if (!value || !/^bearer\s/i.test(value)) return null;
  return value.replace(/^bearer\s/i, "").trim();
};

const readAuthHeader = (headers) => {
  try {
    return new Headers(headers).get("authorization");
  } catch {
    return null;
  }
};

const report = (value) => {
  const token = extractBearer(value);
  if (!token || token === lastSentToken) return;
  lastSentToken = token;
  window.postMessage({ __whoopPoc: "token", token }, TARGET_ORIGIN);
};

const installFetchWrap = () => {
  const originalFetch = window.fetch;
  if (typeof originalFetch !== "function") return;
  window.fetch = function (input, init) {
    try {
      let auth = init && init.headers ? readAuthHeader(init.headers) : null;
      if (!auth && input instanceof Request) {
        auth = input.headers.get("authorization");
      }
      report(auth);
    } catch {
      /* never break the page */
    }
    return originalFetch.apply(this, arguments);
  };
};

const installXhrWrap = () => {
  if (typeof XMLHttpRequest === "undefined") return;
  const originalSet = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    try {
      if (String(name).toLowerCase() === "authorization") report(value);
    } catch {
      /* ignore */
    }
    return originalSet.apply(this, arguments);
  };
};

installFetchWrap();
installXhrWrap();

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    report,
    extractBearer,
    readAuthHeader,
    resetDedup,
    TARGET_ORIGIN,
  };
}
