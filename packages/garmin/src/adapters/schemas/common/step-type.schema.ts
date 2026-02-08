import { z } from "zod";

export const StepTypeId = {
  WARMUP: 1,
  COOLDOWN: 2,
  INTERVAL: 3,
  RECOVERY: 4,
  REST: 5,
  REPEAT: 6,
  MAIN: 8,
} as const;

export const stepTypeKeySchema = z.enum([
  "warmup",
  "cooldown",
  "interval",
  "recovery",
  "rest",
  "repeat",
  "main",
]);

export const garminStepTypeSchema = z.object({
  stepTypeId: z.number().int().positive(),
  stepTypeKey: stepTypeKeySchema,
  displayOrder: z.number().int().nonnegative(),
});

export type GarminStepType = z.infer<typeof garminStepTypeSchema>;
