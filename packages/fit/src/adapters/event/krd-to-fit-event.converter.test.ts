import { describe, expect, it } from "vitest";

import {
  RECORD_BATCH_SAMPLE_SIZE,
  SAMPLE_EVENT_DATA,
  TIME_TOLERANCE_MS,
} from "../../test-utils/constants";
import { convertFitToKrdEvent } from "./fit-to-krd-event.converter";
import {
  convertKrdToFitEvent,
  convertKrdToFitEvents,
} from "./krd-to-fit-event.converter";

describe("convertKrdToFitEvent", () => {
  it.each([
    ["event_start", "timer", "start"],
    ["event_stop", "timer", "stop"],
    ["event_pause", "timer", "stopDisable"],
    ["event_lap", "lap", "marker"],
    ["event_marker", "userMarker", "marker"],
    ["event_workout_step_change", "workoutStep", "marker"],
  ])(
    "should convert %s to event %s/%s",
    (eventType, expectedEvent, expectedEventType) => {
      // Arrange
      const krdEvent = {
        timestamp: "2024-01-01T00:00:00.000Z",
        eventType,
      };

      // Act
      const result = convertKrdToFitEvent(krdEvent);

      // Assert
      expect(result.event).toBe(expectedEvent);
      expect(result.eventType).toBe(expectedEventType);
    }
  );

  it("should preserve event data", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_start",
      eventGroup: 1,
      data: 42,
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.eventGroup).toBe(1);
    expect(result.data).toBe(SAMPLE_EVENT_DATA);
  });

  it("should throw error for invalid KRD event", () => {
    // Arrange
    const invalidEvent = {
      timestamp: "invalid-date",
    };

    // Act
    const act = () => convertKrdToFitEvent(invalidEvent);

    // Assert
    expect(act).toThrow();
  });
});

describe("convertKrdToFitEvents", () => {
  it("should batch convert multiple events", () => {
    // Arrange
    const krdEvents = [
      { timestamp: "2024-01-01T00:00:00.000Z", eventType: "event_start" },
      { timestamp: "2024-01-01T00:01:00.000Z", eventType: "event_lap" },
      { timestamp: "2024-01-01T00:02:00.000Z", eventType: "event_stop" },
    ];

    // Act
    const results = convertKrdToFitEvents(krdEvents);

    // Assert
    expect(results).toHaveLength(RECORD_BATCH_SAMPLE_SIZE);
    expect(results[0].eventType).toBe("start");
    expect(results[1].event).toBe("lap");
    expect(results[2].eventType).toBe("stop");
  });
});

describe("round-trip conversion", () => {
  it.each([
    "event_start",
    "event_stop",
    "event_pause",
    "event_lap",
    "event_marker",
  ])("should preserve %s through KRD -> FIT -> KRD", (eventType) => {
    // Arrange
    const originalKrd = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType,
      eventGroup: 1,
      data: 42,
    };

    // Act
    const fitResult = convertKrdToFitEvent(originalKrd);
    const roundTrippedKrd = convertFitToKrdEvent(fitResult as never);

    // Assert
    const originalTime = new Date(originalKrd.timestamp).getTime();
    const roundTrippedTime = new Date(roundTrippedKrd.timestamp).getTime();
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(
      TIME_TOLERANCE_MS
    );
    expect(roundTrippedKrd.eventType).toBe(eventType);
    expect(roundTrippedKrd.eventGroup).toBe(originalKrd.eventGroup);
    expect(roundTrippedKrd.data).toBe(originalKrd.data);
  });

  it("should preserve start event through round-trip with tolerance", () => {
    // Arrange
    const originalKrd = {
      timestamp: "2024-01-01T00:00:00.500Z",
      eventType: "event_start" as const,
    };
    const fitResult = convertKrdToFitEvent(originalKrd);
    const roundTrippedKrd = convertFitToKrdEvent(fitResult as never);
    const originalTime = new Date(originalKrd.timestamp).getTime();

    // Act
    const roundTrippedTime = new Date(roundTrippedKrd.timestamp).getTime();

    // Assert
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(
      TIME_TOLERANCE_MS
    );
    expect(roundTrippedKrd.eventType).toBe("event_start");
  });
});
