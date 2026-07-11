import { describe, expect, it } from "vitest";

import { buildCyclesPath, chunkWindow } from "./whoop-cycles-window";

const USER_ID = 1629599351;

describe("chunkWindow", () => {
  it("should return a single window when the span is within the cap", () => {
    // Arrange
    const start = "2026-01-01T00:00:00.000Z";
    const end = "2026-03-01T00:00:00.000Z";

    // Act
    const windows = chunkWindow(start, end);

    // Assert
    expect(windows).toEqual([{ startTime: start, endTime: end }]);
  });

  it("should split a window longer than the cap into contiguous sub-windows", () => {
    // Arrange
    const start = "2026-01-01T00:00:00.000Z";
    const end = "2027-05-01T00:00:00.000Z"; // ~485 days

    // Act
    const windows = chunkWindow(start, end);

    // Assert
    expect(windows.length).toBeGreaterThan(1);
    expect(windows[0]?.startTime).toBe(start);
    expect(windows.at(-1)?.endTime).toBe(end);
    for (let i = 1; i < windows.length; i += 1) {
      expect(windows[i]?.startTime).toBe(windows[i - 1]?.endTime);
    }
  });

  it("should return the raw window when the bounds are not parseable", () => {
    // Arrange
    const start = "not-a-date";
    const end = "also-not-a-date";

    // Act
    const windows = chunkWindow(start, end);

    // Assert
    expect(windows).toEqual([{ startTime: start, endTime: end }]);
  });
});

describe("buildCyclesPath", () => {
  it("should build the cycles path with id, startTime, and endTime", () => {
    // Arrange
    const window = {
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2026-03-01T00:00:00.000Z",
    };

    // Act
    const path = buildCyclesPath(USER_ID, window);

    // Assert
    expect(path).toBe(
      `/core-details-bff/v0/cycles/details?id=${USER_ID}` +
        `&startTime=${encodeURIComponent(window.startTime)}` +
        `&endTime=${encodeURIComponent(window.endTime)}`
    );
  });
});
