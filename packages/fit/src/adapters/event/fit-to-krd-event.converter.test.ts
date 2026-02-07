import { describe, expect, it } from "vitest";
import {
  convertFitToKrdEvent,
  convertFitToKrdEvents,
} from "./fit-to-krd-event.converter";
import { convertKrdToFitEvent } from "./krd-to-fit-event.converter";

describe("convertFitToKrdEvent", () => {
  it("should convert timer start event", () => {
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
    expect(result.eventType).toBe("event_start");
  });

  it("should convert timer stop event", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "timer",
      eventType: "stop",
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventType).toBe("event_stop");
  });

  it("should convert timer stopDisable to pause", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "timer",
      eventType: "stopDisable",
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventType).toBe("event_pause");
  });

  it("should convert lap event", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "lap",
      eventType: "marker",
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventType).toBe("event_lap");
  });

  it("should convert workout step event", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "workoutStep",
      eventType: "marker",
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventType).toBe("event_workout_step_change");
  });

  it("should convert user marker event", () => {
    // Arrange
    const fitEvent = {
      timestamp: 1704067200,
      event: "userMarker",
      eventType: "marker",
    };

    // Act
    const result = convertFitToKrdEvent(fitEvent);

    // Assert
    expect(result.eventType).toBe("event_marker");
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
    expect(result.data).toBe(42);
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
    expect(results).toHaveLength(3);
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

    // Act
    const krdResult = convertFitToKrdEvent(originalFit);
    const roundTrippedFit = convertKrdToFitEvent(krdResult);

    // Assert - timestamp preserved
    expect(roundTrippedFit.timestamp).toBe(originalFit.timestamp);

    // Assert - event type preserved
    expect(roundTrippedFit.event).toBe("timer");
    expect(roundTrippedFit.eventType).toBe("start");

    // Assert - optional fields preserved
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

    // Act
    const krdResult = convertFitToKrdEvent(originalFit);
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

    // Act
    const krdResult = convertFitToKrdEvent(originalFit);
    const roundTrippedFit = convertKrdToFitEvent(krdResult);

    // Assert
    expect(roundTrippedFit.timestamp).toBe(originalFit.timestamp);
    expect(roundTrippedFit.event).toBe("timer");
    expect(roundTrippedFit.eventType).toBe("stopDisable");
  });
});
