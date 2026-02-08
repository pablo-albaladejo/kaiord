import { z } from "zod";
import { garminSportTypeSchema } from "../common";
import { garminUnitInputSchema } from "../common/unit.schema";
import { garminWorkoutStepInputSchema } from "./repeat-input.schema";

export const garminWorkoutSegmentInputSchema = z.object({
  segmentOrder: z.number().int().positive(),
  sportType: garminSportTypeSchema,
  workoutSteps: z.array(garminWorkoutStepInputSchema).min(1).max(50),

  description: z.string().max(500).optional(),
  poolLength: z.number().positive().optional(),
  poolLengthUnit: garminUnitInputSchema.optional(),
  avgTrainingSpeed: z.number().nonnegative().optional(),
  estimatedDurationInSecs: z.number().int().nonnegative().optional(),
  estimatedDistanceInMeters: z.number().nonnegative().optional(),
  estimatedDistanceUnit: garminUnitInputSchema.optional(),
  estimateType: z.string().nullable().optional(),
});

export type GarminWorkoutSegmentInput = z.infer<
  typeof garminWorkoutSegmentInputSchema
>;
