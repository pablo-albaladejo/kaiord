import { describe, expect, it } from "vitest";

import { complianceBucket } from "./compliance-bucket";
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const JUST_BELOW_AMBER_MID_BOUNDARY = 0.499 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const AMBER_MID_BOUNDARY = 0.5 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const JUST_BELOW_MID_EMERALD_BOUNDARY = 0.799 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const MID_EMERALD_BOUNDARY = 0.8 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NEGATIVE_OUT_OF_RANGE = -0.5 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const ABOVE_ONE_OUT_OF_RANGE = 1.5 as const;

describe("complianceBucket", () => {
  it("should map null to neutral", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(null)).toBe("neutral");
  });

  it("should map 0 to amber", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(0)).toBe("amber");
  });

  it("should map just below 0.5 to amber", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(JUST_BELOW_AMBER_MID_BOUNDARY)).toBe("amber");
  });

  it("should map boundary 0.5 to mid", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(AMBER_MID_BOUNDARY)).toBe("mid");
  });

  it("should map just below 0.8 to mid", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(JUST_BELOW_MID_EMERALD_BOUNDARY)).toBe("mid");
  });

  it("should map boundary 0.8 to emerald", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(MID_EMERALD_BOUNDARY)).toBe("emerald");
  });

  it("should map 1.0 to emerald", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(1.0)).toBe("emerald");
  });

  it("should clamp out-of-range below 0 to amber", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(NEGATIVE_OUT_OF_RANGE)).toBe("amber");
  });

  it("should clamp out-of-range above 1 to emerald", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(ABOVE_ONE_OUT_OF_RANGE)).toBe("emerald");
  });

  it("should map NaN to neutral", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucket(Number.NaN)).toBe("neutral");
  });
});
