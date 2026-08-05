/**
 * Kaiord Bridge Core — Popup Health Record (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-popup-health.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * Remembers the boundary between a bridge working and not working, so a
 * broken popup can say since when rather than only that it is broken.
 * Two fields under one `chrome.storage.local` key: `lastOkAt`, the most
 * recent probe that succeeded, and `brokenSince`, the FIRST probe observed
 * to fail since that success.
 *
 * The popup owns this record rather than background.js, for three reasons
 * documented at length in the change's design.md: nothing polls, so the
 * popup opening is the only moment most bridges learn anything; a new
 * popup→background action would widen a surface two guards enumerate; and
 * the popup already reads chrome.storage.local directly for the profile
 * snapshot. Read and write therefore sit in the same layer.
 *
 * `brokenSince` is when Kaiord OBSERVED the failure, not when the upstream
 * session actually lapsed — a session can expire on Tuesday and go unseen
 * until Friday. The copy that consumes it is written to be true of the
 * weaker fact: nothing has reached Kaiord since then, which the stamp does
 * establish.
 */

const KD_HEALTH_KEY = "bridgeHealth";

// Storage is best-effort in both directions. A popup that cannot reach
// chrome.storage.local still has a session state to report; it just cannot
// date it, and the dateless copy is exactly the state of knowledge that
// leaves us in.
const readHealth = () =>
  new Promise((resolve) => {
    try {
      chrome.storage.local.get([KD_HEALTH_KEY], (stored) => {
        // Reading lastError marks it handled; leaving it unread makes Chrome
        // log "Unchecked runtime.lastError" on every miss.
        void chrome.runtime.lastError;
        resolve(stored?.[KD_HEALTH_KEY] ?? {});
      });
    } catch {
      resolve({});
    }
  });

const writeHealth = (record) =>
  new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [KD_HEALTH_KEY]: record }, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    } catch {
      resolve();
    }
  });

// A success clears the outage outright, so a bridge that breaks, is fixed,
// and breaks again dates the CURRENT outage rather than the first one ever.
const nextHealth = (previous, ok, now) =>
  ok ? { lastOkAt: now } : { ...previous, brokenSince: previous.brokenSince ?? now };

/**
 * Fold a probe outcome into the stored record and report what the popup may
 * claim about it.
 *
 * `since` is the outage start that was ALREADY KNOWN before this probe — null
 * on the first observation. That distinction is the whole point: on the open
 * where Kaiord first notices, "nothing has reached Kaiord since today" is a
 * vacuous sentence, so the popup falls back to the dateless copy and only
 * starts dating the outage from the next open onward.
 */
const recordProbe = async (ok, now = Date.now()) => {
  const previous = await readHealth();
  const next = nextHealth(previous, ok, now);
  await writeHealth(next);
  return { ...next, since: ok ? null : (previous.brokenSince ?? null) };
};

if (typeof module !== "undefined") {
  module.exports = { KD_HEALTH_KEY, readHealth, nextHealth, recordProbe };
}
