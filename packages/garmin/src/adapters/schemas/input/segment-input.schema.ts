import { z } from "zod";
import { garminSportTypeSchema, garminUnitSchema } from "../common";
import { garminWorkoutStepInputSchema } from "./repeat-input.schema";

export const garminWorkoutSegmentInputSchema = z.object({
  segmentOrder: z.number().int().positive(),
  sportType: garminSportTypeSchema,
  workoutSteps: z.array(garminWorkoutStepInputSchema).min(1).max(50),

  description: z.string().max(500).optional(),
  poolLength: z.number().positive().optional(),
  poolLengthUnit: garminUnitSchema.optional(),
  avgTrainingSpeed: z.number().nonnegative().optional(),
  estimatedDurationInSecs: z.number().int().nonnegative().optional(),
  estimatedDistanceInMeters: z.number().nonnegative().optional(),
  estimatedDistanceUnit: garminUnitSchema.optional(),
  estimateType: z.string().nullable().optional(),
});

export type GarminWorkoutSegmentInput = z.infer<
  typeof garminWorkoutSegmentInputSchema
>;
