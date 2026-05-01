import { describe, expect, it } from "vitest";

import { complianceBucket } from "./compliance-bucket";

describe("complianceBucket", () => {
  it("maps null to neutral", () => {
    expect(complianceBucket(null)).toBe("neutral");
  });

  it("maps 0 to amber", () => {
    expect(complianceBucket(0)).toBe("amber");
  });

  it("maps just below 0.5 to amber", () => {
    expect(complianceBucket(0.499)).toBe("amber");
  });

  it("maps boundary 0.5 to mid", () => {
    expect(complianceBucket(0.5)).toBe("mid");
  });

  it("maps just below 0.8 to mid", () => {
    expect(complianceBucket(0.799)).toBe("mid");
  });

  it("maps boundary 0.8 to emerald", () => {
    expect(complianceBucket(0.8)).toBe("emerald");
  });

  it("maps 1.0 to emerald", () => {
    expect(complianceBucket(1.0)).toBe("emerald");
  });

  it("clamps out-of-range below 0 to amber", () => {
    expect(complianceBucket(-0.5)).toBe("amber");
  });

  it("clamps out-of-range above 1 to emerald", () => {
    expect(complianceBucket(1.5)).toBe("emerald");
  });

  it("maps NaN to neutral", () => {
    expect(complianceBucket(Number.NaN)).toBe("neutral");
  });
});
