/**
 * "I removed it" (design §3.5, §3.9): the athlete clears an `abandoned`
 * entry, written `gone` with 0 calls. Never a `held` entry — it may be
 * another device's verified `Placed` — and never the current `Placed` or
 * `attempting.previous`.
 */
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import type { LedgerKey, PlacementDeps } from "./placement-deps";
import { protectedIds } from "./placement-removal-step";
import { decide, type Row, withEntries } from "./placement-row";

export const isDismissable = (
  row: Row | undefined,
  entry: GarminRemovalEntry
): boolean =>
  entry.abandoned &&
  entry.state === "retire" &&
  !protectedIds(row).has(entry.workoutScheduleId);

export const dismissableEntries = (row: Row | undefined) =>
  (row?.removalQueue ?? []).filter((e) => isDismissable(row, e));

/** `true` when the entry was eligible and is now `gone`. */
export const dismissRemovalEntry = async (
  deps: Pick<PlacementDeps, "ledgerRepo">,
  key: LedgerKey,
  workoutScheduleId: string
): Promise<boolean> =>
  (
    await decide(deps, key, (row) => {
      const entry = row?.removalQueue?.find(
        (e) => e.workoutScheduleId === workoutScheduleId
      );
      if (!row || !entry || !isDismissable(row, entry))
        return { verdict: false };
      const gone: GarminRemovalEntry = { ...entry, state: "gone" };
      return { write: withEntries(row, [gone]), verdict: true };
    })
  ).verdict;
