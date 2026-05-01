import { describe, expect, it } from "vitest";

import { canonicalSportFamily } from "./canonical-sport-family";

describe("canonicalSportFamily", () => {
  it("collapses swim variants to swimming", () => {
    expect(canonicalSportFamily("swim")).toBe("swimming");
    expect(canonicalSportFamily("open_water_swim")).toBe("swimming");
    expect(canonicalSportFamily("lap_swimming")).toBe("swimming");
    expect(canonicalSportFamily("pool_swim")).toBe("swimming");
  });

  it("collapses bike variants to cycling", () => {
    expect(canonicalSportFamily("bike")).toBe("cycling");
    expect(canonicalSportFamily("cycling")).toBe("cycling");
    expect(canonicalSportFamily("road_cycling")).toBe("cycling");
    expect(canonicalSportFamily("gravel_cycling")).toBe("cycling");
    expect(canonicalSportFamily("mountain_biking")).toBe("cycling");
    expect(canonicalSportFamily("indoor_cycling")).toBe("cycling");
    expect(canonicalSportFamily("virtual_cycle")).toBe("cycling");
  });

  it("collapses run variants to running", () => {
    expect(canonicalSportFamily("run")).toBe("running");
    expect(canonicalSportFamily("running")).toBe("running");
    expect(canonicalSportFamily("trail_running")).toBe("running");
    expect(canonicalSportFamily("treadmill_running")).toBe("running");
    expect(canonicalSportFamily("track_running")).toBe("running");
  });

  it("collapses gym variants to strength", () => {
    expect(canonicalSportFamily("gym")).toBe("strength");
    expect(canonicalSportFamily("strength")).toBe("strength");
    expect(canonicalSportFamily("strength_training")).toBe("strength");
    expect(canonicalSportFamily("weightlifting")).toBe("strength");
    expect(canonicalSportFamily("core")).toBe("strength");
  });

  it("returns the raw key for unmapped sports (no cross-sport false matches)", () => {
    expect(canonicalSportFamily("yoga")).toBe("yoga");
    expect(canonicalSportFamily("kayaking")).toBe("kayaking");
    expect(canonicalSportFamily("pilates")).toBe("pilates");
    // Distinct keys remain distinct.
    expect(canonicalSportFamily("yoga")).not.toBe(
      canonicalSportFamily("kayaking")
    );
  });

  it("normalizes case so input variations agree", () => {
    expect(canonicalSportFamily("SWIM")).toBe("swimming");
    expect(canonicalSportFamily("Cycling")).toBe("cycling");
  });
});
