/**
 * Real-decoder fixture tests for activity FIT files.
 *
 * These go through `createGarminFitSdkReader` with the actual SDK `Decoder`,
 * so date_time fields arrive as `Date`, durations already scaled to seconds
 * and enums as profile names. Hand-built numeric messages cannot catch a
 * mismatch with that shape; these fixtures do.
 */
import { krdSchema } from "@kaiord/core";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { createGarminFitSdkReader } from "../garmin-fitsdk";

const read = (fixture: string) =>
  createGarminFitSdkReader(createMockLogger())(loadFitFixture(fixture));

const POOLSWIM_HR_SESSION = { totalTimerTime: 3485.293, totalDistance: 1700 };
const TRUNCATED_RECORD_COUNT = 14;

type SessionCase = {
  fixture: string;
  startTime: string;
  totalElapsedTime: number;
  sport: string;
  laps: number;
  records: number;
};

const SESSION_CASES: Array<SessionCase> = [
  {
    fixture: "Activity.fit",
    startTime: "2021-07-20T21:11:20.000Z",
    totalElapsedTime: 3601,
    sport: "stand_up_paddleboarding",
    laps: 1,
    records: 3601,
  },
  {
    fixture: "activity_developerdata.fit",
    startTime: "2020-09-04T22:00:04.000Z",
    totalElapsedTime: 3601,
    sport: "cycling",
    laps: 1,
    records: 3601,
  },
  {
    fixture: "activity_multisport.fit",
    startTime: "2020-04-20T19:56:20.000Z",
    totalElapsedTime: 55.353,
    sport: "cycling",
    laps: 7,
    records: 78,
  },
  {
    fixture: "activity_poolswim.fit",
    startTime: "2021-07-20T21:11:20.000Z",
    totalElapsedTime: 840,
    sport: "swimming",
    laps: 9,
    records: 24,
  },
  {
    fixture: "activity_poolswim_with_hr.fit",
    startTime: "2016-08-13T13:10:47.000Z",
    totalElapsedTime: 3504.649,
    sport: "swimming",
    laps: 38,
    records: 3501,
  },
];

describe("activity FIT fixtures (real decoder)", () => {
  it.each(SESSION_CASES)(
    "should import $fixture as a valid recorded_activity",
    async (expected) => {
      // Arrange
      const fixture = expected.fixture;

      // Act
      const krd = await read(fixture);

      // Assert
      expect(krdSchema.safeParse(krd).success).toBe(true);
      expect(krd.type).toBe("recorded_activity");
      expect(krd.metadata.sport).toBe(expected.sport);
      const session = krd.sessions?.[0];
      expect(session?.startTime).toBe(expected.startTime);
      expect(session?.totalElapsedTime).toBe(expected.totalElapsedTime);
      expect(krd.laps).toHaveLength(expected.laps);
      expect(krd.laps?.[0]?.startTime).toBe(expected.startTime);
      expect(krd.records).toHaveLength(expected.records);
      expect(krd.events?.length).toBeGreaterThan(0);
    }
  );

  it("should place Activity.fit records one second apart from the session start", async () => {
    // Arrange
    const fixture = "Activity.fit";

    // Act
    const krd = await read(fixture);

    // Assert
    expect(krd.records?.[0]?.timestamp).toBe("2021-07-20T21:11:20.000Z");
    expect(krd.records?.at(-1)?.timestamp).toBe("2021-07-20T22:11:20.000Z");
    expect(krd.events?.[0]).toEqual({
      timestamp: "2021-07-20T21:11:20.000Z",
      eventType: "event_start",
    });
  });

  it("should map the decoder's swim stroke name on pool-swim laps", async () => {
    // Arrange
    const fixture = "activity_poolswim_with_hr.fit";

    // Act
    const krd = await read(fixture);

    // Assert
    expect(krd.laps?.[0]?.swimStroke).toBe("freestyle");
    expect(krd.sessions?.[0]).toMatchObject(POOLSWIM_HR_SESSION);
  });

  it("should import activity_truncated.fit (records and events, no session)", async () => {
    // Arrange
    const fixture = "activity_truncated.fit";

    // Act
    const krd = await read(fixture);

    // Assert
    expect(krdSchema.safeParse(krd).success).toBe(true);
    expect(krd.type).toBe("recorded_activity");
    expect(krd.sessions).toBeUndefined();
    expect(krd.records).toHaveLength(TRUNCATED_RECORD_COUNT);
    expect(krd.records?.[0]?.timestamp).toBe("2012-04-09T21:22:26.000Z");
    expect(krd.events).toHaveLength(1);
  });

  it("should import DeveloperData.fit, dropping records that carry no timestamp", async () => {
    // Arrange
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const reader = createGarminFitSdkReader(logger);

    // Act
    const krd = await reader(loadFitFixture("DeveloperData.fit"));

    // Assert
    expect(krdSchema.safeParse(krd).success).toBe(true);
    expect(krd.type).toBe("recorded_activity");
    expect(krd.records).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      "Dropping FIT records without timestamp",
      { dropped: 3 }
    );
  });
});
