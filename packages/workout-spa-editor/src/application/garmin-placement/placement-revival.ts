/**
 * Kaiord's own entries that a read shows live although the record holds
 * them `gone` (a read that left them out). Only an entry its record holds
 * as created (`isKaiords`) whose removal Kaiord never saw succeed (never
 * `deleted`) is revived: a revival outranks the `gone`, so the entry is the
 * `Placed` again (`keep`) or a surplus to drain (`retire`).
 */
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { isKaiords } from "../sync/merge-garmin-removal-queue";
import type { CalendarEntry } from "./garmin-calendar-port";
import type { Row } from "./placement-row";

export const revived = (
  e: GarminRemovalEntry,
  state: "keep" | "retire"
): GarminRemovalEntry => ({
  workoutScheduleId: e.workoutScheduleId,
  workoutId: e.workoutId,
  date: e.date,
  attempts: 0,
  abandoned: false,
  state,
  revival: (e.revival ?? 0) + 1,
});

const byId = (x: GarminRemovalEntry, y: GarminRemovalEntry) =>
  x.workoutScheduleId.length - y.workoutScheduleId.length ||
  (x.workoutScheduleId < y.workoutScheduleId ? -1 : 1);

/** Kaiord's `gone` entries of `workoutId` on `date` the read shows live,
    lowest id first. */
export const revivable = (
  row: Row | undefined,
  workoutId: string,
  date: string,
  found: readonly CalendarEntry[]
): GarminRemovalEntry[] => {
  const live = new Set(
    found.flatMap((e) =>
      e.date === date && e.workoutScheduleId ? [e.workoutScheduleId] : []
    )
  );
  return (row?.removalQueue ?? [])
    .filter(
      (e) =>
        e.state === "gone" &&
        isKaiords(e) &&
        !e.deleted &&
        e.workoutId === workoutId &&
        e.date === date &&
        live.has(e.workoutScheduleId)
    )
    .sort(byId);
};
