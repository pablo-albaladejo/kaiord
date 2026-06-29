import { describe, expect, it } from "vitest";

import {
  RECORD_BATCH_SAMPLE_SIZE,
  SAMPLE_EVENT_DATA,
} from "../../test-utils/constants";
import {
  convertFitToKrdEvent,
  convertFitToKrdEvents,
} from "./fit-to-krd-event.converter";
import { convertKrdToFitEvent } from "./krd-to-fit-event.converter";

describe("convertFitToKrdEvent", () => {
  it.each([
    ["timer", "start", "event_start"],
    ["timer", "stop", "event_stop"],
    ["timer", "stopDisable", "event_pause"],
    ["lap", "marker", "event_lap"],
    ["workoutStep", "marker", "event_workout_step_change"],
    ["userMarker", "marker", "event_marker"],
  ])("should convert %s/%s event to %s", (event, eventType, expectedType) => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event,
      eventType,
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventType).toBe(expectedType);
  });

  it("should convert FIT timestamp to ISO timestamp", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "timer",
      eventType: "start",
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.timestamp).toBe("2024-01-01T00:00:00.000Z");
  });

  it("should preserve event data", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "timer",
      eventType: "start",
      eventGroup: 1,
      data: 42,
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventGroup).toBe(1);
    expect(result.data).toBe(SAMPLE_EVENT_DATA);
  });

  it("should throw error for invalid FIT event", () => {
    // Arrange
    const invalidEvent = {
      timestamp: "invalid",
    };

    // Act
    const act = () => convertFitToKrdEvent(invalidEvent);

    // Assert
    expect(act).toThrow();
  });
});

describe("convertFitToKrdEvents", () => {
  it("should batch convert multiple events", () => {
    // Arrange
    const fitEvents = [
      { timestamp: 1704067200, event: "timer", eventType: "start" },
      { timestamp: 1704067260, event: "lap", eventType: "marker" },
      { timestamp: 1704067320, event: "timer", eventType: "stop" },
    ];

    // Act
    const results = convertFitToKrdEvents(fitEvents);

    // Assert
    expect(results).toHaveLength(RECORD_BATCH_SAMPLE_SIZE);
    expect(results[0].eventType).toBe("event_start");
    expect(results[1].eventType).toBe("event_lap");
    expect(results[2].eventType).toBe("event_stop");
  });
});

describe("round-trip conversion", () => {
  it("should preserve timer events through FIT -> KRD -> FIT", () => {
    // Arrange
    const originalFit = {
      timestamp: 1704067200,
      event: "timer" as const,
      eventType: "start" as const,
      eventGroup: 1,
      data: 42,
    };
    const krdResult = convertFitToKrdEvent(originalFit);

    // Act
    const roundTrippedFit = convertKrdToFitEvent(krdResult);

    // Assert
    expect(roundTrippedFit.timestamp).toBe(originalFit.timestamp);
    expect(roundTrippedFit.event).toBe("timer");
    expect(roundTrippedFit.eventType).toBe("start");
    expect(roundTrippedFit.eventGroup).toBe(originalFit.eventGroup);
    expect(roundTrippedFit.data).toBe(originalFit.data);
  });

  it("should preserve lap events through FIT -> KRD -> FIT", () => {
    // Arrange
    const originalFit = {
      timestamp: 1704067200,
      event: "lap" as const,
      eventType: "marker" as const,
    };
    const krdResult = convertFitToKrdEvent(originalFit);

    // Act
    const roundTrippedFit = convertKrdToFitEvent(krdResult);

    // Assert
    expect(roundTrippedFit.timestamp).toBe(originalFit.timestamp);
    expect(roundTrippedFit.event).toBe("lap");
    expect(roundTrippedFit.eventType).toBe("marker");
  });

  it("should preserve pause events through FIT -> KRD -> FIT", () => {
    // Arrange
    const originalFit = {
      timestamp: 1704067200,
      event: "timer" as const,
      eventType: "stopDisable" as const,
    };
    const krdResult = convertFitToKrdEvent(originalFit);

    // Act
    const roundTrippedFit = convertKrdToFitEvent(krdResult);

    // Assert
    expect(roundTrippedFit.timestamp).toBe(originalFit.timestamp);
    expect(roundTrippedFit.event).toBe("timer");
    expect(roundTrippedFit.eventType).toBe("stopDisable");
  });
});
