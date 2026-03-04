import { z } from "zod";
import { garminSportTypeSchema } from "../common";
import { garminWorkoutSegmentInputSchema } from "./segment-input.schema";
import { garminUnitInputSchema } from "../common/unit.schema";

export const garminWorkoutInputSchema = z.object({
  sportType: garminSportTypeSchema,
  workoutName: z.string().min(1).max(255),
  workoutSegments: z.array(garminWorkoutSegmentInputSchema).min(1),

  subSportType: z.unknown().nullable().optional(),
  description: z.string().max(2000).optional(),
  estimatedDistanceUnit: garminUnitInputSchema.optional(),
  avgTrainingSpeed: z.number().nonnegative().optional(),
  estimatedDurationInSecs: z.number().int().nonnegative().optional(),
  estimatedDistanceInMeters: z.number().nonnegative().optional(),
  estimateType: z.string().nullable().optional(),

  poolLength: z.number().positive().optional(),
  poolLengthUnit: garminUnitInputSchema.optional(),
});

export type GarminWorkoutInput = z.infer<typeof garminWorkoutInputSchema>;
