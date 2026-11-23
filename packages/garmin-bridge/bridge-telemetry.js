/**
 * Kaiord Bridge Core — Swallowed-error telemetry (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-telemetry.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * Some catch blocks in a service worker swallow an error so one failure
 * does not break the whole extension. This keeps that behaviour but records
 * a structured, capped log so the cause stays inspectable, e.g.
 * `chrome.storage.local.get("bridgeTelemetry")` from the popup or the
 * chrome://extensions devtools. The log stays in the browser and is never
 * sent.
 *
 * This module holds ZERO identity.
 */

// Wrapped so its names never meet a consuming worker's own top-level
// declarations: importScripts shares one global lexical scope.
const bridgeTelemetry = (() => {
  const TELEMETRY_KEY = "bridgeTelemetry";
  const TELEMETRY_MAX_ENTRIES = 25;

  // Writes are chained so concurrent calls cannot interleave their
  // read-modify-write cycles and silently drop each other's entries.
  let telemetryWrite = Promise.resolve();

  const logSwallowed = (level, action, cause) => {
    const entry = {
      level,
      action,
      cause: String(cause?.message ?? cause),
      at: Date.now(),
    };
    telemetryWrite = telemetryWrite
      .then(() => chrome.storage.local.get(TELEMETRY_KEY))
      .then(({ [TELEMETRY_KEY]: existing = [] }) =>
        chrome.storage.local.set({
          [TELEMETRY_KEY]: [...existing, entry].slice(-TELEMETRY_MAX_ENTRIES),
        })
      )
      .catch(() => {
        // Storage itself unavailable (e.g. quota); nothing more we can do.
      });
    return telemetryWrite;
  };

  // Loads one vendored or bridge script into the worker (importScripts), or
  // under Node (tests) through require. A failure is expected under Node and
  // logged at "debug"; in the packaged extension it means a missing or
  // broken file and is logged at "error". `name` picks the one global the
  // script exposes; without it the worker's global scope is returned.
  const loadScript = (file, name) => {
    const underNode = typeof require !== "undefined";
    try {
      importScripts(file);
      return name ? globalThis[name] : globalThis;
    } catch (e) {
      void logSwallowed(underNode ? "debug" : "error", `load-${file}`, e);
      return underNode ? require(`./${file}`) : {};
    }
  };

  return { TELEMETRY_KEY, logSwallowed, loadScript };
})();

if (typeof module !== "undefined") {
  module.exports = bridgeTelemetry;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgeTelemetry = bridgeTelemetry;
}
