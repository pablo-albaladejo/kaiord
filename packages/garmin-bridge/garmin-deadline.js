/**
 * Kaiord Garmin Bridge — one deadline for every request
 *
 * A write is NOT idempotent (two schedule POSTs make two calendar entries),
 * so a write whose outcome is unknown must be told apart from one that never
 * left, and nothing may start a write the App has already given up waiting
 * for. Each request therefore runs under one hard deadline D from handler
 * entry, delivered as an abort signal on the request itself and raced
 * against the token lifecycle — a joined mint included, see garmin-oauth.js
 * `connectapiFetch`. The lifecycle runs on the untimed `fetch`, so a mint
 * other callers join is never aborted by this caller's deadline. No write
 * starts after SEND_CUTOFF_MS.
 *
 * D stays below the ~30 s Chrome gives a pending fetch in an MV3 service
 * worker, so the extension, not Chrome, decides how a hung request ends. The
 * vendored envelope has no `code` field, so the outcome travels in `error`:
 * DEADLINE_BEFORE_SEND (definite — nothing reached Garmin) or
 * DEADLINE_EXCEEDED (ambiguous — sent, then aborted; no status). This is
 * transport, not reading: what the App does with either is the Connector's.
 */

// Wrapped so its names never meet the worker's own top-level declarations:
// importScripts shares one global lexical scope.
const garminDeadline = (() => {
  const REQUEST_DEADLINE_MS = 25000;
  const REQUEST_SEND_CUTOFF_MS = 15000;
  const DEADLINE_BEFORE_SEND = "deadline-before-send";
  const DEADLINE_EXCEEDED = "deadline-exceeded";
  const UNAUTHORIZED_STATUS = 401;

  const deadlineError = (code) => {
    const err = new Error(code);
    err.retryable = true;
    return err;
  };

  const boundedCall = async (oauth, path, method, body) => {
    const startedAt = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException(DEADLINE_EXCEEDED, "AbortError")),
      REQUEST_DEADLINE_MS
    );
    const callUrl = `${oauth.CONNECTAPI}${path}`;
    const isWrite = method !== "GET";
    // `sent`: the call left without a definitive refusal. A 401 means Garmin
    // rejected the token before processing it, so it resets it.
    let sent = false;
    let cutOff = false;
    const fetchImpl = async (url, init = {}) => {
      const isCall = url === callUrl;
      if (isCall) {
        if (
          isWrite &&
          performance.now() - startedAt >= REQUEST_SEND_CUTOFF_MS
        ) {
          cutOff = true;
          throw deadlineError(DEADLINE_BEFORE_SEND);
        }
        sent = true;
      }
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (isCall && res.status === UNAUTHORIZED_STATUS) sent = false;
      return res;
    };
    try {
      return await oauth.connectapiFetch(path, method, body, fetchImpl, {
        signal: controller.signal,
        tokenFetchImpl: fetch,
        raw: true,
      });
    } catch (e) {
      // Nothing sent: any abort — ours or not — is definite.
      const aborted = controller.signal.aborted || oauth.isAbortError(e);
      if (cutOff || (aborted && !sent))
        throw deadlineError(DEADLINE_BEFORE_SEND);
      if (controller.signal.aborted) throw deadlineError(DEADLINE_EXCEEDED);
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    boundedCall,
    REQUEST_DEADLINE_MS,
    REQUEST_SEND_CUTOFF_MS,
    DEADLINE_BEFORE_SEND,
    DEADLINE_EXCEEDED,
  };
})();

if (typeof module !== "undefined") {
  module.exports = garminDeadline;
} else if (typeof self !== "undefined") {
  self.garminDeadline = garminDeadline;
}
