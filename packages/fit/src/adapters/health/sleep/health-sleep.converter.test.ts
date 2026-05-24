import { describe, expect, it } from "vitest";

import {
  mapFitSleepLevelsToKrdSleep,
  mapKrdSleepToFitSleepLevels,
} from "./health-sleep.converter";

const ONE_HOUR_SECONDS = 3600;
const LIGHT_STAGE_HOURS = 3;
const DEEP_STAGE_HOURS = 2;
const REM_STAGE_HOURS = 3;
const LIGHT_STAGE_SECONDS = LIGHT_STAGE_HOURS * ONE_HOUR_SECONDS;
const DEEP_STAGE_SECONDS = DEEP_STAGE_HOURS * ONE_HOUR_SECONDS;
const REM_STAGE_SECONDS = REM_STAGE_HOURS * ONE_HOUR_SECONDS;
const EXPECTED_STAGE_COUNT = 3;

describe("mapFitSleepLevelsToKrdSleep", () => {
  it("should return undefined when fewer than two transitions are supplied", () => {
    // Arrange
    const fitLevels = [
      {
        timestamp: new Date("2026-05-21T23:00:00.000Z"),
        sleepLevel: "light" as const,
      },
    ];

    // Act
    const sleep = mapFitSleepLevelsToKrdSleep(fitLevels);

    // Assert
    expect(sleep).toBeUndefined();
  });

  it("should derive N-1 stages from N transitions with durations from timestamp deltas", () => {
    // Arrange
    const fitLevels = [
      {
        timestamp: new Date("2026-05-21T23:00:00.000Z"),
        sleepLevel: "light" as const,
      },
      {
        timestamp: new Date("2026-05-22T02:00:00.000Z"),
        sleepLevel: "deep" as const,
      },
      {
        timestamp: new Date("2026-05-22T04:00:00.000Z"),
        sleepLevel: "rem" as const,
      },
      {
        timestamp: new Date("2026-05-22T07:00:00.000Z"),
        sleepLevel: "awake" as const,
      },
    ];

    // Act
    const sleep = mapFitSleepLevelsToKrdSleep(fitLevels);

    // Assert
    expect(sleep).toBeDefined();
    expect(sleep?.kind).toBe("sleep");
    expect(sleep?.version).toBe("2.0");
    expect(sleep?.startTime).toBe("2026-05-21T23:00:00.000Z");
    expect(sleep?.endTime).toBe("2026-05-22T07:00:00.000Z");
    expect(sleep?.stages).toHaveLength(EXPECTED_STAGE_COUNT);
    expect(sleep?.stages[0]).toEqual({
      stage: "light",
      startTime: "2026-05-21T23:00:00.000Z",
      durationSeconds: LIGHT_STAGE_SECONDS,
    });
    expect(sleep?.stages[1].stage).toBe("deep");
    expect(sleep?.stages[2].stage).toBe("rem");
    expect(sleep?.totalDurationSeconds).toBe(
      LIGHT_STAGE_SECONDS + DEEP_STAGE_SECONDS + REM_STAGE_SECONDS
    );
  });

  it("should drop unmeasurable transitions from the stage stream", () => {
    // Arrange
    const fitLevels = [
      {
        timestamp: new Date("2026-05-21T23:00:00.000Z"),
        sleepLevel: "light" as const,
      },
      {
        timestamp: new Date("2026-05-22T00:00:00.000Z"),
        sleepLevel: "unmeasurable" as const,
      },
      {
        timestamp: new Date("2026-05-22T07:00:00.000Z"),
        sleepLevel: "awake" as const,
      },
    ];

    // Act
    const sleep = mapFitSleepLevelsToKrdSleep(fitLevels);

    // Assert
    expect(sleep?.stages.map((s) => s.stage)).toEqual(["light"]);
  });
});

describe("mapKrdSleepToFitSleepLevels", () => {
  it("should emit one transition per stage plus a terminator at endTime", () => {
    // Arrange
    const sleep = {
      kind: "sleep" as const,
      version: "2.0",
      startTime: "2026-05-21T23:00:00.000Z",
      endTime: "2026-05-22T07:00:00.000Z",
      totalDurationSeconds: LIGHT_STAGE_SECONDS + DEEP_STAGE_SECONDS,
      stages: [
        {
          stage: "light" as const,
          startTime: "2026-05-21T23:00:00.000Z",
          durationSeconds: LIGHT_STAGE_SECONDS,
        },
        {
          stage: "deep" as const,
          startTime: "2026-05-22T02:00:00.000Z",
          durationSeconds: DEEP_STAGE_SECONDS,
        },
      ],
    };

    // Act
    const fitLevels = mapKrdSleepToFitSleepLevels(sleep);

    // Assert
    expect(fitLevels).toHaveLength(EXPECTED_STAGE_COUNT);
    expect(fitLevels[0].sleepLevel).toBe("light");
    expect(fitLevels[1].sleepLevel).toBe("deep");
    expect(fitLevels[2].sleepLevel).toBe("awake");
    expect((fitLevels[2].timestamp as Date).toISOString()).toBe(sleep.endTime);
  });
});
