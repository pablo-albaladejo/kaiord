import { z } from "zod";

import { garminWorkoutIdSchema } from "./garmin-ledger";

/**
 * A library workout Kaiord created for a record and has since replaced (an
 * edit makes a new one). Every entry is a POST of Kaiord's own, answered
 * with this id: `created` says so, and nothing else is ever listed, so the
 * athlete's workouts are never in the record. `superseded` (still in the
 * library, maybe still on the calendar) < `deleted` (Garmin confirmed it
 * gone); one state per id, only ever raised, joined by max.
 */
export const GARMIN_LIBRARY_VERSION_STATES = ["superseded", "deleted"] as const;
export type GarminLibraryVersionState =
  (typeof GARMIN_LIBRARY_VERSION_STATES)[number];

export const garminLibraryVersionSchema = z.object({
  workoutId: garminWorkoutIdSchema,
  created: z.literal(true),
  state: z.enum(GARMIN_LIBRARY_VERSION_STATES),
});
export type GarminLibraryVersion = z.infer<typeof garminLibraryVersionSchema>;

const rank = (state: GarminLibraryVersionState) =>
  GARMIN_LIBRARY_VERSION_STATES.indexOf(state);

const byId = (x: GarminLibraryVersion, y: GarminLibraryVersion) =>
  x.workoutId.length - y.workoutId.length ||
  (x.workoutId < y.workoutId ? -1 : x.workoutId > y.workoutId ? 1 : 0);

/** One entry per id at its highest state, in ascending id order. */
export const joinLibraryVersions = (
  ...lists: (readonly GarminLibraryVersion[] | undefined)[]
): GarminLibraryVersion[] => {
  const joined = new Map<string, GarminLibraryVersion>();
  for (const v of lists.flatMap((l) => l ?? [])) {
    const seen = joined.get(v.workoutId);
    if (!seen || rank(v.state) > rank(seen.state)) joined.set(v.workoutId, v);
  }
  return [...joined.values()]
    .map((v) => ({
      workoutId: v.workoutId,
      created: true as const,
      state: v.state,
    }))
    .sort(byId);
};

/** The library workout `before` held, when `after` replaces it. */
export const supersededBy = (
  before: { kind: string; workoutId?: string } | undefined,
  after: { kind: string; workoutId?: string } | undefined
): GarminLibraryVersion[] => {
  const id = garminWorkoutIdSchema.safeParse(before?.workoutId);
  if (before?.kind !== "confirmed" || !id.success) return [];
  if (after?.kind === "confirmed" && after.workoutId === id.data) return [];
  if (after === undefined) return [];
  return [{ workoutId: id.data, created: true, state: "superseded" }];
};

/** Only the valid versions Kaiord created, joined (the normalizer's). */
export const parseLibraryVersions = (raw: unknown): GarminLibraryVersion[] =>
  joinLibraryVersions(
    (Array.isArray(raw) ? raw : []).flatMap((v) => {
      const parsed = garminLibraryVersionSchema.safeParse(v);
      return parsed.success ? [parsed.data] : [];
    })
  );
