import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { encodeTextEvents } from "./text-events-encoder";

const makeStep = (extensions?: WorkoutStep["extensions"]): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "open",
  target: { type: "open" },
  extensions,
});

describe("encodeTextEvents", () => {
  it("should return undefined when step has no extensions", () => {
    // Arrange
    const step = makeStep();

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when zwift extension has empty textEvents array", () => {
    // Arrange
    const step = makeStep({ zwift: { textEvents: [] } });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return a single object (not array) for one text event", () => {
    // Arrange
    const step = makeStep({
      zwift: { textEvents: [{ message: "Steady!", timeoffset: 0 }] },
    });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(result).toStrictEqual({ "@_message": "Steady!", "@_timeoffset": 0 });
  });

  it("should include distoffset when present in single event", () => {
    // Arrange
    const step = makeStep({
      zwift: { textEvents: [{ message: "Sprint!", distoffset: 100 }] },
    });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(result).toStrictEqual({
      "@_message": "Sprint!",
      "@_distoffset": 100,
    });
  });

  it("should omit timeoffset key when not present in single event", () => {
    // Arrange
    const step = makeStep({
      zwift: { textEvents: [{ message: "Recover" }] },
    });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(result).toStrictEqual({ "@_message": "Recover" });
    expect((result as Record<string, unknown>)["@_timeoffset"]).toBeUndefined();
    expect((result as Record<string, unknown>)["@_distoffset"]).toBeUndefined();
  });

  it("should return an array for two or more text events", () => {
    // Arrange
    const step = makeStep({
      zwift: {
        textEvents: [
          { message: "First", timeoffset: 0 },
          { message: "Second", timeoffset: 30 },
        ],
      },
    });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(Array.isArray(result)).toBe(true);
    expect(result).toStrictEqual([
      { "@_message": "First", "@_timeoffset": 0 },
      { "@_message": "Second", "@_timeoffset": 30 },
    ]);
  });

  it("should encode three events as an array preserving order", () => {
    // Arrange
    const step = makeStep({
      zwift: {
        textEvents: [
          { message: "A", timeoffset: 0 },
          { message: "B", timeoffset: 15 },
          { message: "C", timeoffset: 45 },
        ],
      },
    });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(Array.isArray(result)).toBe(true);
    const arr = result as Array<Record<string, unknown>>;
    expect(arr[0]).toStrictEqual({ "@_message": "A", "@_timeoffset": 0 });
    expect(arr[1]).toStrictEqual({ "@_message": "B", "@_timeoffset": 15 });
    expect(arr[2]).toStrictEqual({ "@_message": "C", "@_timeoffset": 45 });
  });

  it("should include both timeoffset and distoffset when both are present in multi-event", () => {
    // Arrange
    const step = makeStep({
      zwift: {
        textEvents: [
          { message: "Go", timeoffset: 5, distoffset: 50 },
          { message: "Stop", timeoffset: 60 },
        ],
      },
    });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    const arr = result as Array<Record<string, unknown>>;
    expect(arr[0]).toStrictEqual({
      "@_message": "Go",
      "@_timeoffset": 5,
      "@_distoffset": 50,
    });
    expect(arr[1]).toStrictEqual({ "@_message": "Stop", "@_timeoffset": 60 });
  });

  it("should return undefined when extensions has no zwift key", () => {
    // Arrange
    const step = makeStep({ garmin: { someData: true } });

    // Act
    const result = encodeTextEvents(step);

    // Assert
    expect(result).toBeUndefined();
  });
});
