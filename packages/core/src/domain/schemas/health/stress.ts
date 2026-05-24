import { z } from "zod";

/**
 * Zod schema for `extensions.health.stress` — a continuous stress episode
 * with an average and peak level over a time window (0–100 on Garmin's
 * device-side stress scale).
 */
export const stressEpisodeSchema = z
  .object({
    kind: z.literal("stress"),
    version: z.string().regex(/^2\.\d+$/),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    averageLevel: z.number().int().min(0).max(100),
    peakLevel: z.number().int().min(0).max(100),
  })
  .superRefine((value, ctx) => {
    if (
      new Date(value.endTime).getTime() < new Date(value.startTime).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "endTime must be greater than or equal to startTime.",
        path: ["endTime"],
      });
    }
    if (value.peakLevel < value.averageLevel) {
      ctx.addIssue({
        code: "custom",
        message: "peakLevel must be greater than or equal to averageLevel.",
        path: ["peakLevel"],
      });
    }
  });

export type StressEpisode = z.infer<typeof stressEpisodeSchema>;
