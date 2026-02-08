import { z } from "zod";

export const strokeTypeKeySchema = z
  .enum([
    "free",
    "backstroke",
    "breaststroke",
    "fly",
    "drill",
    "mixed",
    "im",
    "any_stroke",
  ])
  .nullable();

export const garminStrokeTypeSchema = z.object({
  strokeTypeId: z.number().int().nonnegative(),
  strokeTypeKey: strokeTypeKeySchema,
  displayOrder: z.number().int().nonnegative(),
});

export type GarminStrokeType = z.infer<typeof garminStrokeTypeSchema>;
