import { z } from "zod";
import { garminSportTypeSchema, garminUnitSchema } from "../common";
import { garminWorkoutStepSchema } from "./repeat.schema";

export const garminWorkoutSegmentSchema = z.object({
  segmentOrder: z.number().int().positive(),
  sportType: garminSportTypeSchema,
  workoutSteps: z.array(garminWorkoutStepSchema),

  description: z.string().nullable(),
  poolLength: z.number().nullable(),
  poolLengthUnit: garminUnitSchema.nullable(),
  avgTrainingSpeed: z.number().nullable(),
  estimatedDurationInSecs: z.number().nullable(),
  estimatedDistanceInMeters: z.number().nullable(),
  estimatedDistanceUnit: garminUnitSchema.nullable(),
  estimateType: z.string().nullable(),
});

export type GarminWorkoutSegment = z.infer<typeof garminWorkoutSegmentSchema>;
