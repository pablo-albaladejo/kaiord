import { describe, expect, it } from "vitest";
import {
  convertFitToKrdEvent,
  convertFitToKrdEvents,
} from "./fit-to-krd-event.converter";

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
    expect(result.eventType).toBe("start");
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
    expect(result.eventType).toBe("stop");
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
    expect(result.eventType).toBe("pause");
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
    expect(result.eventType).toBe("lap");
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
    expect(result.eventType).toBe("workout_step");
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
    expect(result.eventType).toBe("marker");
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

    // Act & Assert
    expect(() => convertFitToKrdEvent(invalidEvent)).toThrow();
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
    expect(results[0].eventType).toBe("start");
    expect(results[1].eventType).toBe("lap");
    expect(results[2].eventType).toBe("stop");
  });
});
