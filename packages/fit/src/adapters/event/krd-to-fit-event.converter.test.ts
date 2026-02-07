import { describe, expect, it } from "vitest";
import { convertFitToKrdEvent } from "./fit-to-krd-event.converter";
import {
  convertKrdToFitEvent,
  convertKrdToFitEvents,
} from "./krd-to-fit-event.converter";

describe("convertKrdToFitEvent", () => {
  it("should convert start event", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_start",
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.timestamp).toBe(1704067200);
    expect(result.event).toBe("timer");
    expect(result.eventType).toBe("start");
  });

  it("should convert stop event", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_stop",
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.event).toBe("timer");
    expect(result.eventType).toBe("stop");
  });

  it("should convert pause event to stopDisable", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_pause",
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.event).toBe("timer");
    expect(result.eventType).toBe("stopDisable");
  });

  it("should convert lap event", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_lap",
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.event).toBe("lap");
    expect(result.eventType).toBe("marker");
  });

  it("should convert marker event to userMarker", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_marker",
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.event).toBe("userMarker");
    expect(result.eventType).toBe("marker");
  });

  it("should convert workout_step event", () => {
    // Arrange
    const krdEvent = {
      timestamp: "2024-01-01T00:00:00.000Z",
      eventType: "event_workout_step_change",
    };

    // Act
    const result = convertKrdToFitEvent(krdEvent);

    // Assert
    expect(result.event).toBe("workoutStep");
    expect(result.eventType).toBe("marker");
  });

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
    expect(result.data).toBe(42);
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
    expect(results).toHaveLength(3);
    expect(results[0].eventType).toBe("start");
    expect(results[1].event).toBe("lap");
    expect(results[2].eventType).toBe("stop");
  });
});

describe("round-trip conversion", () => {
  it("should preserve common event types through KRD -> FIT -> KRD", () => {
    // Arrange
    const eventTypes = [
      "event_start",
      "event_stop",
      "event_pause",
      "event_lap",
      "event_marker",
    ] as const;

    eventTypes.forEach((eventType) => {
      const originalKrd = {
        timestamp: "2024-01-01T00:00:00.000Z",
        eventType,
        eventGroup: 1,
        data: 42,
      };

      // Act
      const fitResult = convertKrdToFitEvent(originalKrd);
      const roundTrippedKrd = convertFitToKrdEvent(fitResult as never);

      // Assert - timestamp within 1 second tolerance
      const originalTime = new Date(originalKrd.timestamp).getTime();
      const roundTrippedTime = new Date(roundTrippedKrd.timestamp).getTime();
      expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(
        1000
      );

      // Assert - event type preserved (note: pause -> stopDisable -> pause)
      expect(roundTrippedKrd.eventType).toBe(eventType);

      // Assert - optional fields preserved
      expect(roundTrippedKrd.eventGroup).toBe(originalKrd.eventGroup);
      expect(roundTrippedKrd.data).toBe(originalKrd.data);
    });
  });

  it("should preserve start event through round-trip with tolerance", () => {
    // Arrange
    const originalKrd = {
      timestamp: "2024-01-01T00:00:00.500Z",
      eventType: "event_start" as const,
    };

    // Act
    const fitResult = convertKrdToFitEvent(originalKrd);
    const roundTrippedKrd = convertFitToKrdEvent(fitResult as never);

    // Assert - timestamp within 1 second tolerance (FIT loses milliseconds)
    const originalTime = new Date(originalKrd.timestamp).getTime();
    const roundTrippedTime = new Date(roundTrippedKrd.timestamp).getTime();
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(1000);
    expect(roundTrippedKrd.eventType).toBe("event_start");
  });
});
