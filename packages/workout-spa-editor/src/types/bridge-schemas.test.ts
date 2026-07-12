import { MANAGED_DATA_REGISTRY } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  bridgeCapabilitySchema,
  bridgeErrorResponseSchema,
  bridgeManifestSchema,
  syncStateSchema,
} from "./bridge-schemas";

const MULTI_CAPABILITIES_COUNT = 3;

describe("bridgeCapabilitySchema", () => {
  it("should accept all valid capabilities", () => {
    // Arrange

    // Act

    // Assert

    const capabilities = [
      "read:workouts",
      "write:workouts",
      "read:body",
      "read:sleep",
      "read:training-plan",
      "read:training-zones",
    ];

    for (const cap of capabilities) {
      expect(bridgeCapabilitySchema.parse(cap)).toBe(cap);
    }
  });

  it("should reject invalid capability", () => {
    // Arrange

    // Act

    // Assert
    expect(() => bridgeCapabilitySchema.parse("write:sleep")).toThrow();
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

    // Assert
    expect(bridgeManifestSchema.parse(validManifest)).toEqual(validManifest);
  });

  it("should accept multiple capabilities", () => {
    // Arrange

    // Act

    const manifest = {
      ...validManifest,
      capabilities: ["read:workouts", "write:workouts", "read:body"],
    };

    // Assert

    expect(bridgeManifestSchema.parse(manifest).capabilities).toHaveLength(
      MULTI_CAPABILITIES_COUNT
    );
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

      // Assert
      expect(() =>
        bridgeManifestSchema.parse({ ...validManifest, protocolVersion })
      ).toThrow();
    }
  );

  it("should reject empty capabilities with invalid entry", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      bridgeManifestSchema.parse({
        ...validManifest,
        capabilities: ["unknown"],
      })
    ).toThrow();
  });
});

describe("bridgeErrorResponseSchema", () => {
  it("should accept minimal error response", () => {
    // Arrange

    // Act

    const error = { ok: false, error: "Connection failed" };

    // Assert

    expect(bridgeErrorResponseSchema.parse(error)).toEqual(error);
  });

  it("should accept full error response", () => {
    // Arrange

    // Act

    const error = {
      ok: false,
      error: "Rate limited",
      code: "RATE_LIMIT",
      retryable: true,
    };

    // Assert

    expect(bridgeErrorResponseSchema.parse(error)).toEqual(error);
  });

  it("should reject ok: true", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      bridgeErrorResponseSchema.parse({ ok: true, error: "Something" })
    ).toThrow();
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

    // Assert
    expect(syncStateSchema.parse(validState)).toEqual(validState);
  });

  it("should reject non-ISO lastSeen", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      syncStateSchema.parse({ ...validState, lastSeen: "yesterday" })
    ).toThrow();
  });

  it("should reject non-positive protocolVersion", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      syncStateSchema.parse({ ...validState, protocolVersion: 0 })
    ).toThrow();
  });

  it("should reject invalid capability in array", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      syncStateSchema.parse({
        ...validState,
        capabilities: ["delete:workouts"],
      })
    ).toThrow();
  });
});

describe("bridgeCapabilitySchema coverage against MANAGED_DATA_REGISTRY", () => {
  it("should keep bridgeCapabilitySchema in sync with MANAGED_DATA_REGISTRY tokens", () => {
    // Arrange
    const schemaTokens = new Set(bridgeCapabilitySchema.options);
    const registryTokens = Object.values(MANAGED_DATA_REGISTRY)
      .flatMap((entry) => [
        entry.capabilities.import,
        entry.capabilities.export,
      ])
      .filter((t): t is string => typeof t === "string");

    // Act
    const missing = registryTokens.filter((t) => !schemaTokens.has(t));

    // Assert
    expect(missing).toEqual([]);
  });
});

// Contract test (plan F0.3): pins the EXACT dataType↔capability-token
// mapping, not just enum membership. Guards against silent drift between
// @kaiord/core (the registry) and the SPA (the announced-capability enum),
// including the deliberate N:1 mappings (read:body → 5 health types,
// read:training-plan → planned-session).
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
    "body-composition": { import: "read:body" },
    stress: { import: "read:body" },
    strain: { import: "read:body" },
    vitals: { import: "read:body" },
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

  it("should map read:body N:1 onto the seven body-derived health types", () => {
    // Arrange
    const readBodyTypes = Object.entries(MANAGED_DATA_REGISTRY)
      .filter(([, entry]) => entry.capabilities.import === "read:body")
      .map(([type]) => type)
      .sort();

    // Act

    // Assert
    expect(readBodyTypes).toEqual(
      [
        "body-composition",
        "daily-wellness",
        "hrv",
        "strain",
        "stress",
        "vitals",
        "weight",
      ].sort()
    );
  });

  it("should keep read:training-plan mapped N:1 onto planned-session", () => {
    // Arrange
    const trainingPlanTypes = Object.entries(MANAGED_DATA_REGISTRY)
      .filter(([, entry]) => entry.capabilities.import === "read:training-plan")
      .map(([type]) => type);

    // Act

    // Assert
    expect(trainingPlanTypes).toEqual(["planned-session"]);
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
