/**
 * The chat sync tool's result as the model reads it. `SyncWeekResult.error`
 * carries the upstream exception text verbatim — the coaching bridge's own
 * string. The use case keeps it for the UI and the log, but an action-tool
 * result crosses into prompt space, so it is dropped here: `reason` carries
 * every signal the model can act on. A part of the App that did not load
 * adds a sentence, so the model neither retries nor blames Train2Go.
 */
import type { SyncWeekResult } from "../coaching/sync-week";

const NOT_LOADED_FOR_MODEL =
  "Part of the Kaiord App did not load, so nothing was asked of Train2Go. The athlete can reload the App to load it again.";

export const toModelSafeSync = (result: SyncWeekResult): unknown => {
  if (result.ok) return result;
  if (result.reason === "app-part-not-loaded")
    return { ok: false, reason: result.reason, message: NOT_LOADED_FOR_MODEL };
  return { ok: false, reason: result.reason };
};
