import { z } from "zod";

import { SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS } from "./tolerances";
import { healthVersionSchema } from "./version";

/**
 * Zod schema for a single sleep stage within a sleep session.
 *
 * Stages cover a contiguous time slice with one of four canonical Garmin
 * sleep classifications. Adjacent stages do NOT have to be the same kind,
 * but their durations MUST sum to the parent session total within the
 * documented tolerance.
 */
export const sleepStageSchema = z.object({
  stage: z.enum(["awake", "light", "deep", "rem"]),
  startTime: z.iso.datetime(),
  durationSeconds: z.number().int().nonnegative(),
});

export type SleepStage = z.infer<typeof sleepStageSchema>;

/**
 * Zod schema for `extensions.health.sleep` — a single overnight sleep
 * session with REM/deep/light/awake stages, total duration, and optional
 * sleep score / resting heart rate.
 *
 * `stages: []` means the stages were not recorded (e.g. a hand-entered
 * night), so the stage-sum check only applies when stages are present.
 * An absent `totalDurationSeconds` means the duration was not recorded
 * (e.g. only a score was entered); it is never stored as `0`.
 *
 * `version` is constrained to `2.x` so future additive evolution within
 * the v2 line is accepted without bumping the canonical KRD version.
 */
export const sleepRecordSchema = z
  .object({
    kind: z.literal("sleep"),
    version: healthVersionSchema,
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    totalDurationSeconds: z.number().int().nonnegative().optional(),
    stages: z.array(sleepStageSchema),
    score: z.number().int().min(0).max(100).optional(),
    restingHeartRate: z.number().int().positive().optional(),
    kaiordRecordId: z.string().uuid().optional(),
    sourceBridgeId: z.string().optional(),
    externalId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.stages.length === 0) return;
    if (value.totalDurationSeconds === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Sleep stages require totalDurationSeconds.",
        path: ["totalDurationSeconds"],
      });
      return;
    }
    const stagesSum = value.stages.reduce(
      (acc, stage) => acc + stage.durationSeconds,
      0
    );
    const drift = Math.abs(stagesSum - value.totalDurationSeconds);
    if (drift > SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS) {
      ctx.addIssue({
        code: "custom",
        message: `Sum of stage durations (${stagesSum}s) diverges from totalDurationSeconds (${value.totalDurationSeconds}s) by ${drift}s, exceeding the ±${SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS}s tolerance.`,
        path: ["stages"],
      });
    }
  });

export type SleepRecord = z.infer<typeof sleepRecordSchema>;
