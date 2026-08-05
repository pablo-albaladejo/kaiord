import type { ReviewModel } from "../lib/workout-review";
import type { WorkoutRecord } from "../types/calendar-record";

/**
 * The session that was already on the date when a proposal was written.
 *
 * Two constraints, both of which a naive "earliest other record" gets wrong:
 *
 * 1. **It must predate the proposal.** The chat is a persistent log re-rendered
 *    from live Dexie state, so without a `createdAt` bound a session added days
 *    LATER would surface as the "before" of an older message, and a message
 *    that correctly showed no comparison would grow one retroactively.
 * 2. **It must actually summarise.** A record can carry a non-null `krd` and
 *    still yield no review model (an imported activity with no structured
 *    workout). Selecting first and summarising second would answer "nothing to
 *    compare" while a perfectly comparable session sat behind it, so the
 *    candidates are summarised in order and the first success wins.
 */
export function selectPriorSummary<T>(
  records: readonly WorkoutRecord[],
  proposed: WorkoutRecord,
  summarize: (record: WorkoutRecord) => ReviewModel | null,
  toSummary: (model: ReviewModel) => T
): T | null {
  const candidates = records
    .filter(
      (record) =>
        record.id !== proposed.id && record.createdAt < proposed.createdAt
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const candidate of candidates) {
    const model = summarize(candidate);
    if (model) return toSummary(model);
  }
  return null;
}
