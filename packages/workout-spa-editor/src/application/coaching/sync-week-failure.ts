/** Why `syncWeek` synced nothing, and why a week read failed. */
import { isAppPartNotLoaded } from "../../types/app-part-not-loaded-error";

export type SyncWeekFailure = {
  ok: false;
  reason:
    | "route-inactive"
    | "not-linked"
    | "session-expired"
    | "transport-error"
    | "app-part-not-loaded";
  error?: string;
};

/** A failed read: the App's own code did not load (Train2Go was never
    asked), the session expired, or Train2Go did not answer. */
export const readFailure = (err: unknown): SyncWeekFailure => {
  if (isAppPartNotLoaded(err))
    return { ok: false, reason: "app-part-not-loaded" };
  const error = err instanceof Error ? err.message : String(err);
  if (error === "Session expired")
    return { ok: false, reason: "session-expired" };
  return { ok: false, reason: "transport-error", error };
};
