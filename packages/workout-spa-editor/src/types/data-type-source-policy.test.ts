import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  dataTypeSourceModeSchema,
  dataTypeSourcePolicySchema,
} from "./data-type-source-policy";

const VALID_POLICY = {
  profileId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  dataType: "sleep",
  mode: "priority",
  sourceOrder: ["whoop-bridge", "garmin-bridge"],
} as const;

describe("dataTypeSourcePolicySchema", () => {
  it("should accept a valid priority policy with a source order", () => {
    // Arrange

    // Act
    const result = dataTypeSourcePolicySchema.safeParse(VALID_POLICY);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a union policy with an empty source order", () => {
    // Arrange
    const input = { ...VALID_POLICY, mode: "union", sourceOrder: [] };

    // Act
    const result = dataTypeSourcePolicySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an invalid uuid for profileId", () => {
    // Arrange
    const input = { ...VALID_POLICY, profileId: "not-a-uuid" };

    // Act
    const result = dataTypeSourcePolicySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should accept each of the 10 managed data types", () => {
    // Arrange

    // Act
    const results = managedDataTypes.map((dt) =>
      dataTypeSourcePolicySchema.safeParse({ ...VALID_POLICY, dataType: dt })
    );

    // Assert
    for (const result of results) {
      expect(result.success).toBe(true);
    }
  });

  it("should reject an unknown dataType value", () => {
    // Arrange
    const input = { ...VALID_POLICY, dataType: "unknown-type" };

    // Act
    const result = dataTypeSourcePolicySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("dataTypeSourceModeSchema", () => {
  it("should accept union and priority modes", () => {
    // Arrange

    // Act
    const union = dataTypeSourceModeSchema.safeParse("union");
    const priority = dataTypeSourceModeSchema.safeParse("priority");

    // Assert
    expect(union.success).toBe(true);
    expect(priority.success).toBe(true);
  });

  it("should reject an invalid mode value", () => {
    // Arrange
    const input = "first-wins";

    // Act
    const result = dataTypeSourceModeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
