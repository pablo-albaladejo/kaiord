import { describe, expect, it } from "vitest";

import {
  bridgeCapabilitySchema,
  bridgeErrorResponseSchema,
  bridgeManifestSchema,
  syncStateSchema,
} from "./bridge-schemas";
import { MULTI_CAPABILITIES_COUNT } from "./bridge-schemas.test-fixtures";

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

  it("should reject non-integer protocolVersion", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      bridgeManifestSchema.parse({ ...validManifest, protocolVersion: 1.5 })
    ).toThrow();
  });

  it("should reject zero protocolVersion", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      bridgeManifestSchema.parse({ ...validManifest, protocolVersion: 0 })
    ).toThrow();
  });

  it("should reject negative protocolVersion", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      bridgeManifestSchema.parse({ ...validManifest, protocolVersion: -1 })
    ).toThrow();
  });

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
