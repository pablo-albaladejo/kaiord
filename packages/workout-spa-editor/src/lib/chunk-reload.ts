/**
 * Recovery for stale dynamic-import chunks after a deploy.
 *
 * When a new build ships, hashed lazy chunks (e.g. `Today-<hash>.js`) are
 * replaced. A tab still running the previous `index` references the old
 * hashes and fails to import them ("Failed to fetch dynamically imported
 * module"). The fix is a one-shot reload to pull the fresh `index` + chunks.
 *
 * A sessionStorage cooldown prevents a reload loop when the chunk is
 * genuinely unfetchable (offline / persistent 404): after one reload we let
 * the error surface to the route boundary instead of reloading again.
 */
const RELOAD_AT_KEY = "kaiord:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|dynamically imported module/i;

/** True when an error looks like a stale/failed dynamic-import chunk load. */
export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return CHUNK_ERROR_PATTERN.test(message);
};

/**
 * Reload the page once to recover from a stale chunk. Returns `true` if a
 * reload was triggered, `false` if suppressed by the cooldown (loop guard).
 */
// In-memory guard: prevents repeated reloads within a single page load even
// when `sessionStorage` is unavailable (private mode), so a flurry of chunk
// errors (multiple preloadError events / boundary catches) cannot loop.
let reloadedThisLoad = false;

export const reloadOnceForChunkError = (): boolean => {
  if (reloadedThisLoad) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) ?? "0");
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode) — the in-memory guard still
    // ensures we reload at most once per page load.
  }
  reloadedThisLoad = true;
  window.location.reload();
  return true;
};
