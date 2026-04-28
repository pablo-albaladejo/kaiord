/**
 * syncWeek — application use case
 *
 * Pulls a week of coaching activities for a specific (profile, source) pair,
 * upserts to the persisted store, deletes orphaned local rows for the same
 * window (coach-removed activities), and updates the staleness gate
 * UNCONDITIONALLY on success — including zero-activity responses.
 *
 * Window scoping is critical: deletion is bounded to weekStart..weekEnd
 * for the same source, never to the whole profile.
 */

import type {
  CoachingRepository,
  CoachingSyncStateRepository,
  ProfileRepository,
} from "../../ports/persistence-port";
import { addDaysIso } from "../shared/date-utils";
import type { CoachingTransport } from "./coaching-transport-port";

export type SyncWeekDeps = {
  profiles: ProfileRepository;
  coaching: CoachingRepository;
  coachingSyncState: CoachingSyncStateRepository;
  transport: CoachingTransport;
  now?: () => string;
};

export type SyncWeekResult =
  | { ok: true; activityCount: number; orphansDeleted: number }
  | {
      ok: false;
      reason: "not-linked" | "session-expired" | "transport-error";
      error?: string;
    };

export const syncWeek = async (
  deps: SyncWeekDeps,
  profileId: string,
  weekStart: string
): Promise<SyncWeekResult> => {
  const profile = await deps.profiles.getById(profileId);
  if (!profile) return { ok: false, reason: "not-linked" };

  const link = profile.linkedAccounts.find(
    (a) => a.source === deps.transport.source
  );
  if (!link) return { ok: false, reason: "not-linked" };

  const weekEnd = addDaysIso(weekStart, 6);
  const localBefore = await deps.coaching.getByProfileAndDateRange(
    profileId,
    weekStart,
    weekEnd
  );
  const localSameSource = localBefore.filter(
    (r) => r.source === deps.transport.source
  );

  let fetched: Awaited<ReturnType<typeof deps.transport.readWeek>>;
  try {
    fetched = await deps.transport.readWeek(
      profileId,
      weekStart,
      link.externalUserId
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    if (error === "Session expired") {
      return { ok: false, reason: "session-expired" };
    }
    return { ok: false, reason: "transport-error", error };
  }

  await deps.coaching.upsertMany(fetched);

  const fetchedIds = new Set(fetched.map((r) => r.id));
  const orphans = localSameSource.filter((r) => !fetchedIds.has(r.id));
  for (const orphan of orphans) {
    await deps.coaching.delete(orphan.id);
  }

  const now = deps.now ?? (() => new Date().toISOString());
  await deps.coachingSyncState.put({
    source: deps.transport.source,
    profileId,
    lastSyncedAt: now(),
  });

  return {
    ok: true,
    activityCount: fetched.length,
    orphansDeleted: orphans.length,
  };
};
