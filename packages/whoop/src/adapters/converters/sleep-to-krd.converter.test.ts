import { krdSchema, sleepRecordSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { SCORED_SLEEP, UNSCORED_SLEEP } from "../../test-utils/fixtures";
import { mapWhoopSleepToKrd } from "./sleep-to-krd.converter";

describe("mapWhoopSleepToKrd", () => {
  it("should synthesise time-ordered stages whose durations sum to the total", () => {
    // Arrange
    const sleep = SCORED_SLEEP;

    // Act
    const krd = mapWhoopSleepToKrd(sleep);
    const record = krd?.extensions?.health?.sleep;
    const stageSum = (record?.stages ?? []).reduce(
      (acc, stage) => acc + stage.durationSeconds,
      0
    );

    // Assert
    expect(krd?.type).toBe("sleep_record");
    expect(record?.stages.map((stage) => stage.stage)).toEqual([
      "awake",
      "light",
      "deep",
      "rem",
    ]);
    expect(stageSum).toBe(record?.totalDurationSeconds);
    expect(record?.score).toBe(98);
  });

  it("should produce a KRD that validates against the canonical schema", () => {
    // Arrange
    const krd = mapWhoopSleepToKrd(SCORED_SLEEP);

    // Act
    const result = krdSchema.safeParse(krd);
    const sleepResult = sleepRecordSchema.safeParse(
      krd?.extensions?.health?.sleep
    );

    // Assert
    expect(result.success).toBe(true);
    expect(sleepResult.success).toBe(true);
  });

  it("should graft the injected resting heart rate onto the record", () => {
    // Arrange
    const options = { restingHeartRate: 64.6 };

    // Act
    const krd = mapWhoopSleepToKrd(SCORED_SLEEP, options);

    // Assert
    expect(krd?.extensions?.health?.sleep?.restingHeartRate).toBe(65);
  });

  it("should return undefined for an unscored sleep record", () => {
    // Arrange
    const sleep = UNSCORED_SLEEP;

    // Act
    const krd = mapWhoopSleepToKrd(sleep);

    // Assert
    expect(krd).toBeUndefined();
  });
});
