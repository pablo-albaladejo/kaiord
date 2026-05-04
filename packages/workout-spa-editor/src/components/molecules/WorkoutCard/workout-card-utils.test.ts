import { describe, expect, it } from "vitest";

import { formatDuration, getStateIndicator } from "./workout-card-utils";

describe("getStateIndicator", () => {
  it("should return orange indicator for stale", () => {
    const result = getStateIndicator("stale");

    expect(result.label).toBe("Stale");
    expect(result.className).toContain("orange");
  });

  it("should return check for pushed", () => {
    const result = getStateIndicator("pushed");

    expect(result.symbol).toBe("\u2713");
  });

  it("should return star for ready", () => {
    const result = getStateIndicator("ready");

    expect(result.symbol).toBe("\u2605");
  });

  it("should return warning for raw", () => {
    const result = getStateIndicator("raw");

    expect(result.symbol).toBe("\u26A0\uFE0F");
  });
});

describe("formatDuration", () => {
  it("should format minutes only", () => {
    expect(formatDuration(1800)).toBe("30m");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(5400)).toBe("1h 30m");
  });

  it("should format zero minutes", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});
