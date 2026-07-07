import { describe, expect, it } from "vitest";

import { labValueSchema } from "./lab-value";

const baseValue = {
  id: "value-1",
  profileId: "profile-1",
  reportId: "report-1",
  parameterKey: "vitamin_d",
  date: "2026-03-05",
  valueRaw: 60,
  unitRaw: "nmol/L",
  valueCanonical: 24,
  unitCanonical: "ng/mL",
  refLow: 75,
  refHigh: 125,
  refLowCanonical: 30,
  refHighCanonical: 50,
  refSource: "report" as const,
  flag: "low" as const,
  provenance: { source: "manual" as const },
};

describe("labValueSchema", () => {
  it("should accept a fully converted lab value", () => {
    // Arrange
    const input = baseValue;

    // Act
    const result = labValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a value without any reference range", () => {
    // Arrange
    const input = {
      ...baseValue,
      refLow: undefined,
      refHigh: undefined,
      refLowCanonical: undefined,
      refHighCanonical: undefined,
      refSource: "none" as const,
      flag: "unknown" as const,
    };

    // Act
    const result = labValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a missing valueCanonical", () => {
    // Arrange
    const withoutCanonical = { ...baseValue } as Partial<typeof baseValue>;
    delete withoutCanonical.valueCanonical;

    // Act
    const result = labValueSchema.safeParse(withoutCanonical);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an out-of-enum flag", () => {
    // Arrange
    const input = { ...baseValue, flag: "elevated" };

    // Act
    const result = labValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an out-of-enum refSource", () => {
    // Arrange
    const input = { ...baseValue, refSource: "guess" };

    // Act
    const result = labValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
