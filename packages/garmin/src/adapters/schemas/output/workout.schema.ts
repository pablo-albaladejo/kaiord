import { z } from "zod";
import { garminSportTypeSchema, garminUnitSchema } from "../common";
import { garminAuthorSchema } from "./author.schema";
import { garminWorkoutSegmentSchema } from "./segment.schema";

export const garminWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
  ownerId: z.number().int().positive(),
  createdDate: z.string(),
  updatedDate: z.string(),
  author: garminAuthorSchema,

  sportType: garminSportTypeSchema,
  workoutName: z.string(),
  workoutSegments: z.array(garminWorkoutSegmentSchema),

  subSportType: z.unknown().nullable(),
  description: z.string().nullable(),
  trainingPlanId: z.number().nullable(),
  sharedWithUsers: z.array(z.unknown()).nullable(),
  estimatedDurationInSecs: z.number().nullable(),
  estimatedDistanceInMeters: z.number().nullable(),
  estimatedDistanceUnit: garminUnitSchema.nullable(),
  avgTrainingSpeed: z.number().nullable(),
  estimateType: z.string().nullable(),

  poolLength: z.number().nullable(),
  poolLengthUnit: garminUnitSchema.nullable(),

  locale: z.string().nullable(),
  workoutProvider: z.string().nullable(),
  workoutSourceId: z.string().nullable(),
  uploadTimestamp: z.string().nullable(),
  atpPlanId: z.number().nullable(),
  consumer: z.string().nullable(),
  consumerName: z.string().nullable(),
  consumerImageURL: z.string().nullable(),
  consumerWebsiteURL: z.string().nullable(),
  workoutNameI18nKey: z.string().nullable(),
  descriptionI18nKey: z.string().nullable(),
  workoutThumbnailUrl: z.string().nullable(),
  isSessionTransitionEnabled: z.boolean().nullable(),
  shared: z.boolean(),
});

export type GarminWorkout = z.infer<typeof garminWorkoutSchema>;
