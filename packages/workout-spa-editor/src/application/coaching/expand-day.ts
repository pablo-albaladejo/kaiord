/**
 * expandDay — application use case
 *
 * Lazily fetches a single day's activities (with descriptions) for a
 * specific (profile, source) pair. The transport response typically
 * contains every activity on that day, not only the clicked one — so we
 * upsert ALL returned activities so siblings on the same day also gain
 * their descriptions in the same transaction.
 *
 * NOTE: expandDay does NOT update `coachingSyncState.lastSyncedAt` — only
 * `syncWeek` advances the staleness gate. A description fetch is per-day
 * and must not suppress the next legitimate auto-sync of the same week.
 */

import type {
  CoachingRepository,
  ProfileRepository,
} from "../../ports/persistence-port";
import type { CoachingTransport } from "./coaching-transport-port";

export type ExpandDayDeps = {
  profiles: ProfileRepository;
  coaching: CoachingRepository;
  transport: CoachingTransport;
};

export type ExpandDayResult =
  | { ok: true; activityCount: number }
  | {
      ok: false;
      reason: "not-linked" | "session-expired" | "transport-error";
      error?: string;
    };

export const expandDay = async (
  deps: ExpandDayDeps,
  profileId: string,
  date: string
): Promise<ExpandDayResult> => {
  const profile = await deps.profiles.getById(profileId);
  if (!profile) return { ok: false, reason: "not-linked" };

  const link = profile.linkedAccounts.find(
    (a) => a.source === deps.transport.source
  );
  if (!link) return { ok: false, reason: "not-linked" };

  let fetched: Awaited<ReturnType<typeof deps.transport.readDay>>;
  try {
    fetched = await deps.transport.readDay(
      profileId,
      date,
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
  return { ok: true, activityCount: fetched.length };
};
