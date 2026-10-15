/**
 * A persisted daily-wellness row. An imported row carries the full KRD
 * `DailyWellness`; a manual row carries only what the athlete entered
 * (`steps`), so its calories and intensity are absent, never zero-filled.
 */
import { dailyWellnessSchema } from "@kaiord/core";
import type { z } from "zod";

export const storedDailyWellnessSchema = dailyWellnessSchema.partial({
  activeCalories: true,
  restingCalories: true,
  intensityMinutes: true,
});

export type StoredDailyWellness = z.infer<typeof storedDailyWellnessSchema>;
