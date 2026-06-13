/**
 * expandDay — application use case
 *
 * Lazily fetches a single day's activities (with descriptions) for a
 * specific (profile, source) pair. The transport response typically
 * contains every activity on that day, not only the clicked one — so we
 * upsert ALL returned activities so siblings on the same day also gain
 * their descriptions in the same transaction.
 *
 * The same response carries the day's comment thread. It is persisted as
 * a day-scoped `coachingDayNotes` record, replaced wholesale. A comments
 * failure MUST NOT break the activities upsert (the dialog still renders
 * descriptions); it is logged with a static message instead. When the
 * transport omits `comments` (older bridge), local notes are untouched.
 *
 * NOTE: expandDay does NOT update `coachingSyncState.lastSyncedAt` — only
 * `syncWeek` advances the staleness gate. A description fetch is per-day
 * and must not suppress the next legitimate auto-sync of the same week.
 */

import type {
  CoachingDayNotesRepository,
  CoachingRepository,
  ProfileRepository,
} from "../../ports/persistence-port";
import type { CoachingDayComment } from "../../types/coaching-day-notes-record";
import { buildCoachingDayNotesId } from "../../types/coaching-day-notes-record";
import { logger } from "../../utils/logger";
import type { CoachingTransport } from "./coaching-transport-port";

export type ExpandDayDeps = {
  profiles: ProfileRepository;
  coaching: CoachingRepository;
  coachingDayNotes: CoachingDayNotesRepository;
  transport: CoachingTransport;
};

export type ExpandDayResult =
  | { ok: true; activityCount: number }
  | {
      ok: false;
      reason: "not-linked" | "session-expired" | "transport-error";
      error?: string;
    };

const persistDayNotes = async (
  deps: ExpandDayDeps,
  profileId: string,
  date: string,
  comments: CoachingDayComment[] | undefined
): Promise<void> => {
  // `undefined` → bridge did not send comments; leave local notes intact.
  if (comments === undefined) return;
  const source = deps.transport.source;
  try {
    await deps.coachingDayNotes.upsert({
      id: buildCoachingDayNotesId(profileId, source, date),
      profileId,
      source,
      date,
      comments,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    // Isolated from the activities upsert — a notes write failure must not
    // hide the descriptions. Static message; never interpolate content.
    logger.warn("[expand-day] failed to persist day comments", { source });
  }
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

  await deps.coaching.upsertMany(fetched.activities);
  await persistDayNotes(deps, profileId, date, fetched.comments);
  return { ok: true, activityCount: fetched.activities.length };
};
