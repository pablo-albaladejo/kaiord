import { z } from "zod";

export const TargetTypeId = {
  NO_TARGET: 1,
  POWER_ZONE: 2,
  CADENCE_ZONE: 3,
  HEART_RATE_ZONE: 4,
  SPEED_ZONE: 5,
  PACE_ZONE: 6,
  SWIM_CSS_OFFSET: 17,
  SWIM_INSTRUCTION: 18,
} as const;

export const targetTypeKeySchema = z.enum([
  "no.target",
  "power.zone",
  "cadence",
  "heart.rate.zone",
  "speed.zone",
  "pace.zone",
  "swim.css.offset",
  "swim.instruction",
]);

export const garminTargetTypeSchema = z.object({
  workoutTargetTypeId: z.number().int().positive(),
  workoutTargetTypeKey: targetTypeKeySchema,
  displayOrder: z.number().int().nonnegative(),
});

export type GarminTargetType = z.infer<typeof garminTargetTypeSchema>;
