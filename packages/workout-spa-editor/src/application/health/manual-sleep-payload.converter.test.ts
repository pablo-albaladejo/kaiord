import { sleepRecordSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildSleepPayload } from "./manual-sleep-payload.converter";

const DAY = "2026-10-10";
const SEVEN_THIRTY = 27000;
const EIGHT_HOURS = 28800;
const SCORE = 81;
const MS_PER_SECOND = 1000;
const BEDTIME = "2026-10-09T23:00:00.000Z";
const WAKE = "2026-10-10T06:30:00.000Z";

const spanSeconds = (start: string, end: string): number =>
  (new Date(end).getTime() - new Date(start).getTime()) / MS_PER_SECOND;

describe("buildSleepPayload", () => {
  it("should store the hours slept as the night's duration", () => {
    // Arrange
    const entry = { durationSeconds: SEVEN_THIRTY };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload?.totalDurationSeconds).toBe(SEVEN_THIRTY);
    expect(spanSeconds(payload!.startTime, payload!.endTime)).toBe(
      SEVEN_THIRTY
    );
    expect(payload?.stages).toEqual([]);
    expect(sleepRecordSchema.safeParse(payload).success).toBe(true);
  });

  it("should keep a score alone as a score without inventing a duration", () => {
    // Arrange
    const entry = { score: SCORE };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload?.score).toBe(SCORE);
    expect(payload).not.toHaveProperty("totalDurationSeconds");
    expect(sleepRecordSchema.safeParse(payload).success).toBe(true);
  });

  it("should store hours and score together", () => {
    // Arrange
    const entry = { durationSeconds: SEVEN_THIRTY, score: SCORE };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload?.totalDurationSeconds).toBe(SEVEN_THIRTY);
    expect(payload?.score).toBe(SCORE);
  });

  it("should derive the duration from bedtime and wake time", () => {
    // Arrange
    const entry = { startTime: BEDTIME, endTime: WAKE };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload?.totalDurationSeconds).toBe(SEVEN_THIRTY);
    expect(payload?.startTime).toBe(BEDTIME);
    expect(payload?.endTime).toBe(WAKE);
  });

  it("should end the night at the wake time when only it is given", () => {
    // Arrange
    const entry = { durationSeconds: SEVEN_THIRTY, endTime: WAKE };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload?.startTime).toBe(BEDTIME);
    expect(payload?.endTime).toBe(WAKE);
  });

  it("should start the night at the bedtime when only it is given", () => {
    // Arrange
    const entry = { durationSeconds: SEVEN_THIRTY, startTime: BEDTIME };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload?.startTime).toBe(BEDTIME);
    expect(payload?.endTime).toBe(WAKE);
  });

  it("should reject hours that disagree with bedtime and wake time", () => {
    // Arrange
    const entry = {
      durationSeconds: EIGHT_HOURS,
      startTime: BEDTIME,
      endTime: WAKE,
    };

    // Act
    const payload = buildSleepPayload(entry, DAY);

    // Assert
    expect(payload).toBeUndefined();
  });

  it.each([{ durationSeconds: 0 }, { durationSeconds: -60 }, {}])(
    "should never build a zero-length night ($durationSeconds)",
    (entry) => {
      // Arrange
      const input = entry;

      // Act
      const payload = buildSleepPayload(input, DAY);

      // Assert
      expect(payload).toBeUndefined();
    }
  );
});
