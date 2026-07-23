import { MANAGED_DATA_REGISTRY } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  bridgeCapabilitySchema,
  bridgeErrorResponseSchema,
  bridgeManifestSchema,
  syncStateSchema,
} from "./bridge-schemas";

describe("bridgeCapabilitySchema", () => {
  it("should reject invalid capability", () => {
    // Arrange
    const unknown = "write:sleep";

    // Act
    const result = bridgeCapabilitySchema.safeParse(unknown);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("bridgeManifestSchema", () => {
  const validManifest = {
    id: "garmin-bridge",
    name: "Garmin Connect Bridge",
    version: "1.0.0",
    protocolVersion: 1,
    capabilities: ["write:workouts"],
  };

  it("should accept valid manifest", () => {
    // Arrange

    // Act
    const parsed = bridgeManifestSchema.parse(validManifest);

    // Assert
    expect(parsed).toEqual(validManifest);
  });

  it.each([
    { protocolVersion: 1.5 },
    { protocolVersion: 0 },
    { protocolVersion: -1 },
  ])(
    "should reject protocolVersion $protocolVersion",
    ({ protocolVersion }) => {
      // Arrange

      // Act
      const result = bridgeManifestSchema.safeParse({
        ...validManifest,
        protocolVersion,
      });

      // Assert
      expect(result.success).toBe(false);
    }
  );

  it("should reject an unknown capability entry", () => {
    // Arrange

    // Act
    const result = bridgeManifestSchema.safeParse({
      ...validManifest,
      capabilities: ["unknown"],
    });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("bridgeErrorResponseSchema", () => {
  it.each([
    { shape: "minimal", error: { ok: false, error: "Connection failed" } },
    {
      shape: "full",
      error: {
        ok: false,
        error: "Rate limited",
        code: "RATE_LIMIT",
        retryable: true,
      },
    },
  ])("should accept a $shape error response", ({ error }) => {
    // Arrange

    // Act
    const parsed = bridgeErrorResponseSchema.parse(error);

    // Assert
    expect(parsed).toEqual(error);
  });

  it("should reject ok: true", () => {
    // Arrange

    // Act
    const result = bridgeErrorResponseSchema.safeParse({
      ok: true,
      error: "Something",
    });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("syncStateSchema", () => {
  const validState = {
    source: "garmin",
    extensionId: "ext-abc123",
    lastSeen: "2025-01-15T10:00:00Z",
    capabilities: ["write:workouts"],
    protocolVersion: 1,
  };

  it("should accept valid sync state", () => {
    // Arrange

    // Act
    const parsed = syncStateSchema.parse(validState);

    // Assert
    expect(parsed).toEqual(validState);
  });

  it.each([
    { field: "a non-ISO lastSeen", patch: { lastSeen: "yesterday" } },
    { field: "a non-positive protocolVersion", patch: { protocolVersion: 0 } },
    {
      field: "an unknown capability in the array",
      patch: { capabilities: ["delete:workouts"] },
    },
  ])("should reject $field", ({ patch }) => {
    // Arrange

    // Act
    const result = syncStateSchema.safeParse({ ...validState, ...patch });

    // Assert
    expect(result.success).toBe(false);
  });
});

// Contract test (plan F0.3): pins the EXACT dataType↔capability-token
// mapping, not just enum membership, so @kaiord/core (the registry) and the
// SPA (the announced-capability enum) cannot drift apart silently.
describe("core↔SPA capability contract", () => {
  const EXPECTED_CAPABILITIES: Record<
    string,
    { import?: string; export?: string }
  > = {
    workout: { import: "read:workouts", export: "write:workouts" },
    "planned-session": { import: "read:training-plan" },
    activity: { import: "read:activities" },
    "training-zones": { import: "read:training-zones" },
    weight: { import: "read:body" },
    sleep: { import: "read:sleep" },
    hrv: { import: "read:body" },
    "daily-wellness": { import: "read:body" },
    "body-composition": { import: "read:body", export: "write:body" },
    stress: { import: "read:body" },
    strain: { import: "read:body" },
    vitals: { import: "read:body" },
    "heart-rate-series": { import: "read:body" },
  };

  it("should match the exact expected token mapping for every managed type", () => {
    // Arrange
    const actual = Object.fromEntries(
      Object.entries(MANAGED_DATA_REGISTRY).map(([type, entry]) => [
        type,
        entry.capabilities,
      ])
    );

    // Act

    // Assert
    expect(actual).toEqual(EXPECTED_CAPABILITIES);
  });

  it("should declare every registry token in the announced-capability enum", () => {
    // Arrange
    const schemaTokens = new Set(bridgeCapabilitySchema.options);
    const tokens = Object.values(EXPECTED_CAPABILITIES).flatMap((c) =>
      [c.import, c.export].filter((t): t is string => typeof t === "string")
    );

    // Act
    const missing = tokens.filter((t) => !schemaTokens.has(t));

    // Assert
    expect(missing).toEqual([]);
  });
});
