import { z } from "zod";
import { garminSportTypeSchema, garminUnitSchema } from "../common";
import { garminWorkoutSegmentInputSchema } from "./segment-input.schema";

export const garminWorkoutInputSchema = z.object({
  sportType: garminSportTypeSchema,
  workoutName: z.string().min(1).max(255),
  workoutSegments: z.array(garminWorkoutSegmentInputSchema).min(1),

  subSportType: z.unknown().nullable().optional(),
  description: z.string().max(2000).optional(),
  estimatedDistanceUnit: garminUnitSchema.optional(),
  avgTrainingSpeed: z.number().nonnegative().optional(),
  estimatedDurationInSecs: z.number().int().nonnegative().optional(),
  estimatedDistanceInMeters: z.number().nonnegative().optional(),
  estimateType: z.string().nullable().optional(),

  poolLength: z.number().positive().optional(),
  poolLengthUnit: garminUnitSchema.optional(),
});

export type GarminWorkoutInput = z.infer<typeof garminWorkoutInputSchema>;
