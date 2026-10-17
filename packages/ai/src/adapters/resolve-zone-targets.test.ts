import { describe, expect, it } from "vitest";

import type { AthleteZoneTables } from "../types";
import { resolveZoneTargets } from "./resolve-zone-targets";

const ZONES: AthleteZoneTables = {
  pace: [
    { zone: 1, minMps: 2.5641, maxMps: 2.8985 },
    { zone: 2, minMps: 2.8985, maxMps: 3.1746 },
    { zone: 5, minMps: 3.7736, maxMps: 4.2553 },
  ],
  power: [
    { zone: 1, minWatts: 0, maxWatts: 137 },
    { zone: 3, minWatts: 188, maxWatts: 225 },
    { zone: 4, minWatts: 226, maxWatts: 262 },
  ],
};

type Value = Record<string, unknown>;

const step = (type: string, value?: Value, intensity = "active") => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: type,
  target: value ? { type, value } : { type },
  intensity,
});

const resolveOne = (
  sport: string,
  s: ReturnType<typeof step>,
  zones: AthleteZoneTables = ZONES
) => {
  const out = resolveZoneTargets({ sport, steps: [s] }, zones) as {
    steps: Array<ReturnType<typeof step>>;
  };
  return out.steps[0]!;
};

describe("resolveZoneTargets", () => {
  it("should turn a pace zone into the athlete's range, rounded to mm/s", () => {
    // Arrange
    const s = step("pace", { unit: "zone", value: 1 });

    // Act
    const result = resolveOne("running", s);

    // Assert
    expect(result.target).toEqual({
      type: "pace",
      value: { unit: "range", min: 2.564, max: 2.899 },
    });
  });

  it("should span a progressive pace step from the low zone's slow end to the high zone's fast end", () => {
    // Arrange
    const s = step("pace", { unit: "zone", min: 2, max: 5 });

    // Act
    const result = resolveOne("running", s);

    // Assert
    expect(result.target.value).toEqual({
      unit: "range",
      min: 2.899,
      max: 4.255,
    });
  });

  it("should turn a power zone span into watts", () => {
    // Arrange
    const s = step("power", { unit: "zone", min: 4, max: 3 });

    // Act
    const result = resolveOne("cycling", s);

    // Assert
    expect(result.target.value).toEqual({ unit: "range", min: 188, max: 262 });
  });

  it("should keep a zone when the athlete has no zones, collapsing a span to its upper zone", () => {
    // Arrange
    const s = step("pace", { unit: "zone", min: 4, max: 5 });

    // Act
    const result = resolveOne("running", s, {});

    // Assert
    expect(result.target.value).toEqual({ unit: "zone", value: 5 });
  });

  it("should keep a zone the athlete's table does not define", () => {
    // Arrange
    const s = step("power", { unit: "zone", value: 2 });

    // Act
    const result = resolveOne("cycling", s);

    // Assert
    expect(result.target.value).toEqual({ unit: "zone", value: 2 });
  });

  it.each([
    ["running", "pace", "recovery"],
    ["running", "pace", "cooldown"],
    ["cycling", "power", "warmup"],
  ])(
    "should give an open %s %s step with %s intensity zone 1",
    (sport, type, intensity) => {
      // Arrange
      const s = step("open", undefined, intensity);

      // Act
      const result = resolveOne(sport, s, {});

      // Assert
      expect(result.targetType).toBe(type);
      expect(result.target).toEqual({
        type,
        value: { unit: "zone", value: 1 },
      });
    }
  );

  it("should leave an open interval without stated intensity open", () => {
    // Arrange
    const s = step("open", undefined, "interval");

    // Act
    const result = resolveOne("running", s);

    // Assert
    expect(result.target).toEqual({ type: "open" });
  });

  it("should leave swimming steps and heart-rate zones untouched", () => {
    // Arrange
    const swim = step("open", undefined, "recovery");
    const hr = step("heart_rate", { unit: "zone", value: 2 });

    // Act
    const swimResult = resolveOne("swimming", swim);
    const hrResult = resolveOne("running", hr);

    // Assert
    expect(swimResult).toEqual(swim);
    expect(hrResult).toEqual(hr);
  });

  it("should resolve steps inside repetition blocks", () => {
    // Arrange
    const raw = {
      sport: "running",
      steps: [
        { repeatCount: 4, steps: [step("pace", { unit: "zone", value: 1 })] },
      ],
    };

    // Act
    const out = resolveZoneTargets(raw, ZONES) as {
      steps: Array<{ steps: Array<ReturnType<typeof step>> }>;
    };

    // Assert
    expect(out.steps[0]!.steps[0]!.target.value).toMatchObject({
      unit: "range",
    });
  });

  it("should return non-workout input unchanged for strict validation to reject", () => {
    // Arrange
    const raw = { name: "not a workout" };

    // Act
    const out = resolveZoneTargets(raw, ZONES);

    // Assert
    expect(out).toBe(raw);
  });
});
