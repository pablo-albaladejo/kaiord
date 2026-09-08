import { z } from "zod";

/**
 * TrainingPeaks structured-workout shapes for
 * `POST /fitness/v6/athletes/{athleteId}/workouts`.
 *
 * Derived from a live capture, not from documentation: the public sources all
 * describe a `v3` route that no longer accepts writes. Two shapes here exist
 * only because the wire demands them:
 *
 * - `structure` is a JSON-encoded STRING on the request and an object on the
 *   response, so {@link trainingPeaksWorkoutSchema} types it as a string and
 *   the converter serialises it last.
 * - a block's `length.value` is its REPEAT COUNT (`1` for a lone step, `N` for
 *   an interval block), while a step's `length.value` is its duration. Same
 *   field name, two meanings, distinguished only by `unit`.
 */

/** `warmUp | active | rest | coolDown` — the classes TrainingPeaks renders. */
export const trainingPeaksIntensityClassSchema = z.enum([
  "warmUp",
  "active",
  "rest",
  "coolDown",
]);

/** Block kinds observed on the wire. `repetition` carries interval blocks. */
export const trainingPeaksBlockTypeSchema = z.enum([
  "step",
  "repetition",
  "rampUp",
]);

/** Intensity band. TrainingPeaks always sends a range, even for a point value. */
export const trainingPeaksTargetSchema = z.object({
  minValue: z.number(),
  maxValue: z.number(),
});

export const trainingPeaksStepSchema = z.object({
  name: z.string(),
  length: z.object({ value: z.number().positive(), unit: z.literal("second") }),
  targets: z.array(trainingPeaksTargetSchema).length(1),
  intensityClass: trainingPeaksIntensityClassSchema,
  openDuration: z.boolean(),
});

/** `begin`/`end` are seconds from workout start; `end` already counts repeats. */
export const trainingPeaksBlockSchema = z.object({
  type: trainingPeaksBlockTypeSchema,
  length: z.object({
    value: z.number().int().positive(),
    unit: z.literal("repetition"),
  }),
  steps: z.array(trainingPeaksStepSchema).min(1),
  begin: z.number().nonnegative(),
  end: z.number().positive(),
});

/** Which metric the `targets` percentages are relative to. */
export const trainingPeaksIntensityMetricSchema = z.enum([
  "percentOfFtp",
  "percentOfThresholdPace",
  "percentOfMaxHr",
  "percentOfThresholdHr",
]);

export const trainingPeaksStructureSchema = z.object({
  structure: z.array(trainingPeaksBlockSchema).min(1),
  polyline: z.array(z.tuple([z.number(), z.number()])),
  primaryLengthMetric: z.literal("duration"),
  primaryIntensityMetric: trainingPeaksIntensityMetricSchema,
  primaryIntensityTargetOrRange: z.literal("range"),
});

/** The POST body. `workoutId: 0` creates; `structure` is the encoded string. */
export const trainingPeaksWorkoutSchema = z.object({
  athleteId: z.number().int().positive(),
  workoutId: z.literal(0),
  /** `YYYY-MM-DD`. A future date needs a paid tier — the API answers 402. */
  workoutDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  description: z.string().nullable(),
  workoutTypeValueId: z.number().int().positive(),
  /** Fractional HOURS, not seconds. */
  totalTimePlanned: z.number().positive(),
  publicSettingValue: z.literal(0),
  structure: z.string(),
});

export type TrainingPeaksBlock = z.infer<typeof trainingPeaksBlockSchema>;
export type TrainingPeaksIntensityClass = z.infer<
  typeof trainingPeaksIntensityClassSchema
>;
export type TrainingPeaksIntensityMetric = z.infer<
  typeof trainingPeaksIntensityMetricSchema
>;
export type TrainingPeaksStep = z.infer<typeof trainingPeaksStepSchema>;
export type TrainingPeaksStructure = z.infer<
  typeof trainingPeaksStructureSchema
>;
export type TrainingPeaksWorkout = z.infer<typeof trainingPeaksWorkoutSchema>;
