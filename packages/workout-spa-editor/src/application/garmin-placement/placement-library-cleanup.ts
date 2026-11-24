/**
 * After a run settles a `Placed`: delete each earlier library workout of
 * the record that Kaiord created and no calendar entry uses (design
 * "Library workouts settled 2026-11-23"). Unused is proven live, with the
 * safe-write decision every write shares (`readLiveState`): each month
 * the record knows the version in reads absent twice, `SETTLE_MS` apart;
 * a failed read keeps it. The row is re-read right before the delete; a
 * delete answered ok, or 404 (already gone), writes `deleted`; any other
 * answer writes nothing, so the next send tries again. A re-sign-in answer
 * ends the step. Without the library port or `calendar-find`, nothing is
 * deleted.
 */
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import { joinLibraryVersions } from "../../types/garmin-library-version";
import { readLiveState } from "../safe-writes/live-state";
import type { PlacementRun } from "./placement-deps";
import { deletableVersions, monthsToRead } from "./placement-library-versions";
import type { Row } from "./placement-row";
import { SETTLE_MS } from "./placement-timing";

const absentFrom = async (
  run: PlacementRun,
  workoutId: GarminWorkoutId,
  date: string
) => {
  const { state } = await readLiveState(
    async () => {
      const read = await run.deps.calendar.find(workoutId, date);
      if (!read.ok) return { state: "unknown" as const };
      return { state: read.entries.length > 0 ? "present" : "absent" } as const;
    },
    { ms: SETTLE_MS, sleep: run.deps.sleep }
  );
  return state === "absent";
};

const unusedOnCalendar = async (
  run: PlacementRun,
  row: Row,
  workoutId: GarminWorkoutId
) => {
  for (const date of monthsToRead(row, workoutId))
    if (!(await absentFrom(run, workoutId, date))) return false;
  return true;
};

const markDeleted = (run: PlacementRun, workoutId: GarminWorkoutId) =>
  run.deps.ledgerRepo.mutateByKey(run.key, (row) =>
    row?.libraryVersions?.some((v) => v.workoutId === workoutId)
      ? {
          ...row,
          libraryVersions: joinLibraryVersions(row.libraryVersions, [
            { workoutId, created: true, state: "deleted" },
          ]),
        }
      : undefined
  );

const stillDeletable = async (run: PlacementRun, id: GarminWorkoutId) =>
  deletableVersions(
    await run.deps.ledgerRepo.findByNaturalKey(run.key)
  ).includes(id);

export const cleanLibrary = async (run: PlacementRun): Promise<void> => {
  const library = run.deps.library;
  if (!library || !run.deps.canFind) return;
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  for (const workoutId of deletableVersions(row)) {
    if (!(await unusedOnCalendar(run, row!, workoutId))) continue;
    if (!(await stillDeletable(run, workoutId))) continue;
    const answer = await library.remove(workoutId);
    if (answer.ok || answer.status === 404) {
      await markDeleted(run, workoutId);
      continue;
    }
    if (answer.status === 401 || answer.needsReauth) return;
  }
};
