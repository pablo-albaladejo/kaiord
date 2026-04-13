import { describe, expect, it } from "vitest";

import { getT2GSportDisplay } from "./train2go-sport-map";

describe("getT2GSportDisplay", () => {
  it("maps known sport", () => {
    const result = getT2GSportDisplay("cycling");
    expect(result.label).toBe("Cycling");
    expect(result.icon).toBeTruthy();
  });

  it("is case insensitive", () => {
    expect(getT2GSportDisplay("SWIMMING").label).toBe("Swimming");
    expect(getT2GSportDisplay("Running").label).toBe("Running");
  });

  it("returns fallback for unknown sport", () => {
    const result = getT2GSportDisplay("quidditch");
    expect(result.label).toBe("Activity");
    expect(result.icon).toBeTruthy();
  });

  it("returns fallback for empty string", () => {
    const result = getT2GSportDisplay("");
    expect(result.label).toBe("Activity");
  });

  it("maps all 24 known sports without throwing", () => {
    const sports = [
      "cycling",
      "running",
      "swimming",
      "gym",
      "stretching",
      "yoga",
      "pilates",
      "rest",
      "walk",
      "mountainwalk",
      "trail",
      "mountainbike",
      "stationarybike",
      "rowing",
      "indoorrowing",
      "climbing",
      "ski",
      "mountainski",
      "sprint",
      "tennis",
      "cardio",
      "canicross",
      "canibike",
      "dog",
    ];

    for (const sport of sports) {
      const result = getT2GSportDisplay(sport);
      expect(result.label).not.toBe("Activity");
    }
  });
});
