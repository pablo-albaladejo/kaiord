import { flushPendingSaves } from "../pending-flushes";
import { hasUnsavedEdits } from "../unsaved-edits";
import { getRegistration, requestReload, setUpdateState } from "./update-store";

export type ApplyOutcome = "blocked" | "applying" | "none";

/**
 * Hands the tab to the waiting worker, in the order design D4 fixes:
 * unsaved edits stop it before the worker hears anything, pending saves are
 * flushed, then SKIP_WAITING. Only this tab reloads, once the new worker
 * takes control (see `start-service-worker`).
 */
export async function applyUpdate(): Promise<ApplyOutcome> {
  if (hasUnsavedEdits()) {
    setUpdateState("blocked");
    return "blocked";
  }
  await flushPendingSaves();
  const waiting = getRegistration()?.waiting;
  if (!waiting) return "none";
  requestReload();
  setUpdateState("applying");
  waiting.postMessage({ type: "SKIP_WAITING" });
  return "applying";
}
