import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  integrationPolicyDirectionSchema,
  integrationPolicyModeSchema,
  integrationPolicySchema,
} from "./integration-policy";

const VALID_POLICY = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  profileId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  dataType: "weight",
  bridgeId: "garmin-bridge",
  direction: "import",
  mode: "auto",
  enabled: true,
  updatedAt: "2026-05-01T08:00:00.000Z",
} as const;

describe("integrationPolicySchema", () => {
  it("should accept a valid integration policy object", () => {
    // Arrange

    // Act
    const result = integrationPolicySchema.safeParse(VALID_POLICY);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an invalid uuid for id field", () => {
    // Arrange
    const input = { ...VALID_POLICY, id: "not-a-uuid" };

    // Act
    const result = integrationPolicySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an invalid uuid for profileId field", () => {
    // Arrange
    const input = { ...VALID_POLICY, profileId: "bad-id" };

    // Act
    const result = integrationPolicySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should accept each of the 9 managed data types", () => {
    // Arrange

    // Act
    const results = managedDataTypes.map((dt) =>
      integrationPolicySchema.safeParse({ ...VALID_POLICY, dataType: dt })
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
    const result = integrationPolicySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("integrationPolicyModeSchema", () => {
  it("should accept manual and auto modes", () => {
    // Arrange

    // Act
    const manual = integrationPolicyModeSchema.safeParse("manual");
    const auto = integrationPolicyModeSchema.safeParse("auto");

    // Assert
    expect(manual.success).toBe(true);
    expect(auto.success).toBe(true);
  });

  it("should reject an invalid mode value", () => {
    // Arrange
    const input = "scheduled";

    // Act
    const result = integrationPolicyModeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("integrationPolicyDirectionSchema", () => {
  it("should accept import and export directions", () => {
    // Arrange

    // Act
    const imp = integrationPolicyDirectionSchema.safeParse("import");
    const exp = integrationPolicyDirectionSchema.safeParse("export");

    // Assert
    expect(imp.success).toBe(true);
    expect(exp.success).toBe(true);
  });

  it("should reject an invalid direction value", () => {
    // Arrange
    const input = "sync";

    // Act
    const result = integrationPolicyDirectionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
