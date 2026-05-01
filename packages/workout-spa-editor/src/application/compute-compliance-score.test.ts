import { describe, expect, it } from "vitest";

import { computeComplianceScore } from "./compute-compliance-score";

describe("computeComplianceScore", () => {
  it("returns approximately 0.956 for hit-target (45min plan, 43min actual)", () => {
    const score = computeComplianceScore(2700, 2580);
    expect(score).not.toBeNull();
    expect(score!).toBeCloseTo(0.956, 2);
  });

  it("returns 0.5 for substantial undershoot (60min plan, 30min actual)", () => {
    expect(computeComplianceScore(3600, 1800)).toBe(0.5);
  });

  it("returns 0.5 for substantial overshoot (60min plan, 90min actual)", () => {
    expect(computeComplianceScore(3600, 5400)).toBe(0.5);
  });

  it("clamps to 0 for very large variance", () => {
    expect(computeComplianceScore(60, 600)).toBe(0);
    expect(computeComplianceScore(60, 6000)).toBe(0);
  });

  it("returns null when planDur is undefined", () => {
    expect(computeComplianceScore(undefined, 2580)).toBeNull();
  });

  it("returns null when actualDur is undefined", () => {
    expect(computeComplianceScore(2700, undefined)).toBeNull();
  });

  it("returns null when both are undefined", () => {
    expect(computeComplianceScore(undefined, undefined)).toBeNull();
  });

  it("returns null when planDur is 0 (division-by-zero guard)", () => {
    expect(computeComplianceScore(0, 1800)).toBeNull();
  });

  it("returns null on NaN inputs", () => {
    expect(computeComplianceScore(NaN, 1800)).toBeNull();
    expect(computeComplianceScore(2700, NaN)).toBeNull();
  });

  it("is symmetric — undershoot and overshoot yield identical scores", () => {
    expect(computeComplianceScore(2700, 2580)).toBe(
      computeComplianceScore(2700, 2820)
    );
  });
});
