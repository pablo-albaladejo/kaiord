import { z } from "zod";

export const SportTypeId = {
  RUNNING: 1,
  CYCLING: 2,
  HIKING: 3,
  SWIMMING: 4,
  STRENGTH_TRAINING: 5,
  CARDIO_TRAINING: 6,
  MULTI_SPORT: 10,
} as const;

export const sportTypeKeySchema = z.enum([
  "running",
  "cycling",
  "hiking",
  "swimming",
  "strength_training",
  "cardio_training",
  "multi_sport",
]);

export const garminSportTypeSchema = z.object({
  sportTypeId: z.number().int().positive(),
  sportTypeKey: sportTypeKeySchema,
  displayOrder: z.number().int().nonnegative().optional(),
});

export type GarminSportType = z.infer<typeof garminSportTypeSchema>;
