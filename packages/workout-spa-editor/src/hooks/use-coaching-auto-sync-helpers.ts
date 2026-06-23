import type { Analytics } from "@kaiord/core";

import type { PersistencePort } from "../ports/persistence-port";
import type { CoachingSyncState } from "./use-coaching-activities";

const STALENESS_MS = 10 * 60 * 1000;

export const isStale = (
  lastSyncedAt: string | undefined,
  now: number
): boolean => {
  if (!lastSyncedAt) return true;
  const t = Date.parse(lastSyncedAt);
  if (Number.isNaN(t)) return true;
  return now - t > STALENESS_MS;
};

/**
 * Per-source result of an auto-sync attempt. `skipped` means the staleness
 * gate was closed; `synced` a clean run; `failed` an error surfaced on the
 * source or thrown. Returned so the loop can record a `{ source, outcome }`
 * trail for observability without changing the silent-auto-sync behavior.
 */
export type SourceSyncOutcome = "skipped" | "synced" | "failed";

export const runSourceSync = async (
  src: CoachingSyncState,
  profileId: string,
  weekStart: string,
  trigger: string,
  now: number,
  persistence: PersistencePort,
  analytics: Analytics
): Promise<SourceSyncOutcome> => {
  try {
    const row = await persistence.coachingSyncState.getBySourceAndProfile(
      src.id,
      profileId
    );
    if (!isStale(row?.lastSyncedAt, now)) return "skipped";
    analytics.event("coaching.sync.invoked", {
      source: src.id,
      profileId,
      trigger,
    });
    await src.sync(weekStart);
    if (src.error) {
      analytics.event("coaching.sync.failure", {
        source: src.id,
        profileId,
        errorKind: "transport-error",
        isAutoSync: true,
      });
      return "failed";
    }
    return "synced";
  } catch {
    // Silent; raw exception text never reaches telemetry.
    analytics.event("coaching.sync.failure", {
      source: src.id,
      profileId,
      errorKind: "transport-error",
      isAutoSync: true,
    });
    return "failed";
  }
};
