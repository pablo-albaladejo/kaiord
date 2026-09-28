import { z } from "zod";

/**
 * Garmin ids are only ever minted by Garmin: a positive decimal integer.
 * The two brands keep a library workout id and a calendar schedule id apart
 * at compile time, so one can never be sent where the other is expected.
 */
const GARMIN_ID_SHAPE = /^[1-9]\d*$/;

export const garminWorkoutIdSchema = z
  .string()
  .regex(GARMIN_ID_SHAPE)
  .brand<"GarminWorkoutId">();
export type GarminWorkoutId = z.infer<typeof garminWorkoutIdSchema>;

export const garminScheduleIdSchema = z
  .string()
  .regex(GARMIN_ID_SHAPE)
  .brand<"GarminScheduleId">();
export type GarminScheduleId = z.infer<typeof garminScheduleIdSchema>;

export const parseGarminWorkoutId = (
  value: unknown
): GarminWorkoutId | undefined => {
  const parsed = garminWorkoutIdSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

export const parseGarminScheduleId = (
  value: unknown
): GarminScheduleId | undefined => {
  const parsed = garminScheduleIdSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

export const calendarDate = z.iso.date();

export const garminLibraryStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("confirmed"), workoutId: garminWorkoutIdSchema }),
  z.object({ kind: z.literal("unconfirmed") }),
  z.object({ kind: z.literal("missing"), workoutId: garminWorkoutIdSchema }),
]);
export type GarminLibraryState = z.infer<typeof garminLibraryStateSchema>;

const scheduledSchema = z.object({
  kind: z.literal("scheduled"),
  workoutScheduleId: garminScheduleIdSchema,
  workoutId: garminWorkoutIdSchema,
  date: calendarDate,
});

/** Sorted and unique, so equal lists serialise equally (merge laws). */
export const canonicalScheduleIds = <T extends string>(ids: T[]): T[] =>
  [...new Set(ids)].sort((x, y) => x.length - y.length || (x < y ? -1 : 1));

/** `supersedes`: the ids the row knew when it committed this id-less entry,
    so none of them is it (design §3.9). Absent (legacy, adoption) = `[]`. */
const unconfirmedPlacedSchema = z.object({
  kind: z.literal("unconfirmed"),
  workoutId: garminWorkoutIdSchema,
  date: calendarDate,
  supersedes: z
    .array(garminScheduleIdSchema)
    .transform(canonicalScheduleIds)
    .default([]),
});

export const garminPlacedSchema = z.discriminatedUnion("kind", [
  scheduledSchema,
  unconfirmedPlacedSchema,
]);
export type GarminPlaced = z.infer<typeof garminPlacedSchema>;

export const garminPlacementSchema = z.discriminatedUnion("kind", [
  scheduledSchema,
  unconfirmedPlacedSchema,
  z.object({
    kind: z.literal("attempting"),
    workoutId: garminWorkoutIdSchema,
    date: calendarDate,
    at: z.iso.datetime(),
    posted: z.boolean(),
    previous: garminPlacedSchema.optional(),
  }),
  z.object({
    kind: z.literal("uncertain"),
    workoutId: garminWorkoutIdSchema,
    date: calendarDate,
    previous: garminPlacedSchema.optional(),
  }),
]);
export type GarminPlacement = z.infer<typeof garminPlacementSchema>;

export const isGarminPlaced = (
  placement: GarminPlacement | undefined
): placement is GarminPlaced =>
  placement?.kind === "scheduled" || placement?.kind === "unconfirmed";
