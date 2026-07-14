import { sleepRecordSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { CYCLES_DETAILS_WRAPPED } from "../../test-utils/cycles-fixture";
import { whoopCyclesResponseSchema } from "../schemas/whoop-cycles.schema";
import { sleepsToSleep } from "./sleeps-to-sleep.converter";

const [RECORD] = whoopCyclesResponseSchema.parse(CYCLES_DETAILS_WRAPPED);
const [SLEEP] = RECORD.sleeps;

const EXPECTED_SCORE = 90;
const EXPECTED_TOTAL_SECONDS = 28884;
const TOLERANCE_SECONDS = 60;

const stageSum = (durations: number[]): number =>
  durations.reduce((acc, value) => acc + value, 0);

describe("sleepsToSleep", () => {
  it("should map a sleep entry to a KRD sleep record with stages", () => {
    // Arrange

    // Act
    const sleep = sleepsToSleep(SLEEP);

    // Assert
    expect(sleep.kind).toBe("sleep");
    expect(sleep.startTime).toBe("2026-07-09T22:24:47.970Z");
    expect(sleep.endTime).toBe("2026-07-10T06:26:12.340Z");
    expect(sleep.score).toBe(EXPECTED_SCORE);
    expect(sleep.stages.map((stage) => stage.stage)).toEqual([
      "light",
      "deep",
      "rem",
      "awake",
    ]);
  });

  it("should convert total duration from milliseconds to seconds", () => {
    // Arrange

    // Act
    const sleep = sleepsToSleep(SLEEP);

    // Assert
    expect(sleep.totalDurationSeconds).toBe(EXPECTED_TOTAL_SECONDS);
  });

  it("should keep the stage-duration sum within 60s of the total", () => {
    // Arrange

    // Act
    const sleep = sleepsToSleep(SLEEP);
    const sum = stageSum(sleep.stages.map((stage) => stage.durationSeconds));

    // Assert
    expect(Math.abs(sum - sleep.totalDurationSeconds)).toBeLessThanOrEqual(
      TOLERANCE_SECONDS
    );
    expect(sleepRecordSchema.safeParse(sleep).success).toBe(true);
  });

  it("should set externalId to the sleep activity_id", () => {
    // Arrange

    // Act
    const sleep = sleepsToSleep(SLEEP);

    // Assert
    expect(sleep.externalId).toBe(SLEEP.activity_id);
    expect(sleep.sourceBridgeId).toBe("whoop-bridge");
  });
});
