/**
 * Train2Go record mapper — tests
 *
 * Replaces the old `train2go-mapper.test.ts`. The mapper chain is now
 * Train2GoActivity → CoachingActivityRecord (this file) →
 * CoachingActivity (coaching-record-to-activity.converter.ts).
 */

import { describe, expect, it } from "vitest";

import type { Train2GoActivity } from "../../store/train2go-extension-transport";
import {
  toCoachingActivityRecord,
  TRAIN2GO_STATUS_MAP,
} from "./train2go-record.converter";

const base: Train2GoActivity = {
  id: 12345,
  date: "2026-04-13",
  sport: "cycling",
  title: "FTP test",
  duration: "01:30:00",
  workload: 4,
  status: 0,
};

const NOW = "2026-04-28T10:00:00.000Z";

describe("toCoachingActivityRecord", () => {
  it("should produce composite id and stringifies sourceId at the boundary", () => {
    // Arrange

    // Act
    const result = toCoachingActivityRecord("p1", base, NOW);

    // Assert
    expect(result.id).toBe("p1:train2go:12345");
    expect(result.sourceId).toBe("12345");
    expect(typeof result.sourceId).toBe("string");
  });

  it("should preserve raw workload unclamped and computes intensity 1..5", () => {
    // Arrange
    const HIGH_WORKLOAD = 7;
    const MAX_INTENSITY = 5;

    // Act
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, workload: HIGH_WORKLOAD },
      NOW
    );

    // Assert
    expect(result.workload).toBe(HIGH_WORKLOAD);
    expect(result.intensity).toBe(MAX_INTENSITY);
  });

  it("should round non-integer workloads to a literal intensity (no decimals)", () => {
    // Arrange
    const FRACTIONAL_WORKLOAD = 4.7;
    const ROUNDED_INTENSITY = 5;

    // Act
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, workload: FRACTIONAL_WORKLOAD },
      NOW
    );

    // Assert
    expect(result.workload).toBe(FRACTIONAL_WORKLOAD);
    expect(result.intensity).toBe(ROUNDED_INTENSITY);
    expect(Number.isInteger(result.intensity)).toBe(true);
  });

  it("should emit intensity undefined when workload is 0", () => {
    // Arrange

    // Act
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, workload: 0 },
      NOW
    );

    // Assert
    expect(result.workload).toBe(0);
    expect(result.intensity).toBeUndefined();
  });

  it.each([
    [0, "pending"],
    [1, "completed"],
    [-1, "skipped"],
  ] as const)("should map status %s → %s", (code, expected) => {
    // Arrange

    // Act
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, status: code },
      NOW
    );

    // Assert
    expect(result.status).toBe(expected);
  });

  it("should fall back to pending for unknown status codes", () => {
    // Arrange

    // Act
    const result = toCoachingActivityRecord("p1", { ...base, status: 99 }, NOW);

    // Assert
    expect(result.status).toBe("pending");
  });

  it("should carry completion → completionPercent", () => {
    // Arrange
    const COMPLETION_PERCENT = 85;

    // Act
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, completion: COMPLETION_PERCENT },
      NOW
    );

    // Assert
    expect(result.completionPercent).toBe(COMPLETION_PERCENT);
  });

  it("should guard against drift via STATUS_MAP parity test", () => {
    // Arrange

    // Act

    // Assert
    expect(TRAIN2GO_STATUS_MAP).toEqual({
      0: "pending",
      1: "completed",
      [-1]: "skipped",
    });
  });
});
