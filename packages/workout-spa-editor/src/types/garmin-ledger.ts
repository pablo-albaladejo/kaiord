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

const calendarDate = z.iso.date();

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

const unconfirmedPlacedSchema = z.object({
  kind: z.literal("unconfirmed"),
  workoutId: garminWorkoutIdSchema,
  date: calendarDate,
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

export const garminRemovalEntrySchema = z.object({
  workoutScheduleId: garminScheduleIdSchema,
  workoutId: garminWorkoutIdSchema,
  date: calendarDate,
  attempts: z.number().int().nonnegative(),
  abandoned: z.boolean(),
});
export type GarminRemovalEntry = z.infer<typeof garminRemovalEntrySchema>;

export const isGarminPlaced = (
  placement: GarminPlacement | undefined
): placement is GarminPlaced =>
  placement?.kind === "scheduled" || placement?.kind === "unconfirmed";
