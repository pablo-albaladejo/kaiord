/**
 * One removal-queue entry joined with another of the same schedule id, for
 * the Garmin ledger merge. Pure, no I/O. The join is a semilattice
 * (commutative, associative, idempotent), so merges in any order agree.
 */
import {
  GARMIN_REMOVAL_STATES,
  type GarminRemovalEntry,
} from "../../types/garmin-removal-entry";

const rank = (e: GarminRemovalEntry) => GARMIN_REMOVAL_STATES.indexOf(e.state);

export const entryKey = (e: GarminRemovalEntry) =>
  `${e.date}\u0000${e.workoutId}\u0000${e.workoutScheduleId}`;

const revivalOf = (e: GarminRemovalEntry) => e.revival ?? 0;

/** The entry in the schema's key order, so equal entries serialise
    equally whichever writer built them. */
const canonical = (
  e: GarminRemovalEntry,
  facts: Partial<GarminRemovalEntry>
): GarminRemovalEntry => ({
  workoutScheduleId: e.workoutScheduleId,
  workoutId: e.workoutId,
  date: e.date,
  attempts: facts.attempts ?? e.attempts,
  abandoned: facts.abandoned ?? e.abandoned,
  state: e.state,
  ...(facts.created ? { created: true } : {}),
  ...(facts.recognised ? { recognised: true } : {}),
  ...(facts.noticed ? { noticed: true } : {}),
  ...(facts.deleted ? { deleted: true } : {}),
  ...(e.revival ? { revival: e.revival } : {}),
});

/** A higher revival wins whole (its own attempts and `deleted`); within
    one revival the higher state, the larger `attempts` and the OR of
    `abandoned` and `deleted`. Who made the entry is ORed always. */
export const joinEntries = (
  x: GarminRemovalEntry,
  y: GarminRemovalEntry
): GarminRemovalEntry => {
  const who = {
    created: x.created || y.created,
    recognised: x.recognised || y.recognised,
    noticed: x.noticed || y.noticed,
  };
  const epoch = revivalOf(x) - revivalOf(y);
  if (epoch !== 0) {
    const w = epoch > 0 ? x : y;
    return canonical(w, { ...who, deleted: w.deleted });
  }
  const order = rank(x) - rank(y) || (entryKey(x) >= entryKey(y) ? 1 : -1);
  return canonical(order > 0 ? x : y, {
    ...who,
    attempts: Math.max(x.attempts, y.attempts),
    abandoned: x.abandoned || y.abandoned,
    deleted: x.deleted || y.deleted,
  });
};

/** Kaiord may delete the entry: its record holds it as created. */
export const isKaiords = (e: GarminRemovalEntry) =>
  e.created === true || !e.recognised;
