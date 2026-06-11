import { describe, expect, it } from "vitest";
import type { ZodTypeAny } from "zod";

import { bodyCompositionSchema } from "./body-composition";
import { dailyWellnessSchema } from "./daily";
import { hrvSummarySchema } from "./hrv";
import { sleepRecordSchema } from "./sleep";
import { stressEpisodeSchema } from "./stress";
import { weightMeasurementSchema } from "./weight";

// Every health payload shares the same `version: z.string().regex(/^2\.\d+$/)`
// major-version gate. These minimal v2.0 bases are valid for their schema and
// differ only by `version` in the cases below, so the version regex is the sole
// reason a sub-2 payload is rejected.
const validBases = {
  weight: {
    kind: "weight" as const,
    measuredAt: "2026-05-22T07:15:00.000Z",
    weightKilograms: 72.4,
  },
  hrv: {
    kind: "hrv" as const,
    measuredAt: "2026-05-22T06:00:00.000Z",
    rMSSD: 45.2,
    measurementWindow: "overnight" as const,
    score: 72,
  },
  daily: {
    kind: "daily" as const,
    date: "2026-05-22",
    steps: 9432,
    activeCalories: 412,
    restingCalories: 1684,
    intensityMinutes: { moderate: 23, vigorous: 8 },
    floorsClimbed: 12,
  },
  bodyComposition: {
    kind: "bodyComposition" as const,
    measuredAt: "2026-05-22T07:15:00.000Z",
    bodyFatPercent: 18.4,
  },
  sleep: {
    kind: "sleep" as const,
    startTime: "2026-05-21T23:00:00.000Z",
    endTime: "2026-05-22T07:00:00.000Z",
    totalDurationSeconds: 28800,
    stages: [
      {
        stage: "light" as const,
        startTime: "2026-05-21T23:00:00.000Z",
        durationSeconds: 10800,
      },
      {
        stage: "deep" as const,
        startTime: "2026-05-22T02:00:00.000Z",
        durationSeconds: 7200,
      },
      {
        stage: "rem" as const,
        startTime: "2026-05-22T04:00:00.000Z",
        durationSeconds: 7200,
      },
      {
        stage: "awake" as const,
        startTime: "2026-05-22T06:00:00.000Z",
        durationSeconds: 3600,
      },
    ],
  },
  stress: {
    kind: "stress" as const,
    startTime: "2026-05-22T14:00:00.000Z",
    endTime: "2026-05-22T14:45:00.000Z",
    averageLevel: 58,
    peakLevel: 82,
  },
} as const;

const versionGateCases: ReadonlyArray<
  readonly [string, ZodTypeAny, Record<string, unknown>]
> = [
  ["weightMeasurementSchema", weightMeasurementSchema, validBases.weight],
  ["hrvSummarySchema", hrvSummarySchema, validBases.hrv],
  ["dailyWellnessSchema", dailyWellnessSchema, validBases.daily],
  ["bodyCompositionSchema", bodyCompositionSchema, validBases.bodyComposition],
  ["sleepRecordSchema", sleepRecordSchema, validBases.sleep],
  ["stressEpisodeSchema", stressEpisodeSchema, validBases.stress],
];

describe("health schema major-version gate", () => {
  it.each(versionGateCases)(
    "should accept a v2.0 payload under %s",
    (_name, schema, base) => {
      // Arrange
      const input = { ...base, version: "2.0" };

      // Act
      const result = schema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    }
  );

  it.each(versionGateCases)(
    "should accept a forward-compatible v2.1 payload under %s",
    (_name, schema, base) => {
      // Arrange
      const input = { ...base, version: "2.1" };

      // Act
      const result = schema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    }
  );

  it.each(versionGateCases)(
    "should reject a wrong major version under %s",
    (_name, schema, base) => {
      // Arrange
      const input = { ...base, version: "1.0" };

      // Act
      const result = schema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    }
  );
});
