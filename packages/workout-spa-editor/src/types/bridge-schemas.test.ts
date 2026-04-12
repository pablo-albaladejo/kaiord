import { describe, expect, it } from "vitest";

import {
  bridgeCapabilitySchema,
  bridgeErrorResponseSchema,
  bridgeManifestSchema,
  syncStateSchema,
} from "./bridge-schemas";

describe("bridgeCapabilitySchema", () => {
  it("accepts all valid capabilities", () => {
    const capabilities = [
      "read:workouts",
      "write:workouts",
      "read:body",
      "read:sleep",
    ];

    for (const cap of capabilities) {
      expect(bridgeCapabilitySchema.parse(cap)).toBe(cap);
    }
  });

  it("rejects invalid capability", () => {
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

  it("accepts valid manifest", () => {
    expect(bridgeManifestSchema.parse(validManifest)).toEqual(validManifest);
  });

  it("accepts multiple capabilities", () => {
    const manifest = {
      ...validManifest,
      capabilities: ["read:workouts", "write:workouts", "read:body"],
    };

    expect(bridgeManifestSchema.parse(manifest).capabilities).toHaveLength(3);
  });

  it("rejects non-integer protocolVersion", () => {
    expect(() =>
      bridgeManifestSchema.parse({ ...validManifest, protocolVersion: 1.5 })
    ).toThrow();
  });

  it("rejects zero protocolVersion", () => {
    expect(() =>
      bridgeManifestSchema.parse({ ...validManifest, protocolVersion: 0 })
    ).toThrow();
  });

  it("rejects negative protocolVersion", () => {
    expect(() =>
      bridgeManifestSchema.parse({ ...validManifest, protocolVersion: -1 })
    ).toThrow();
  });

  it("rejects empty capabilities with invalid entry", () => {
    expect(() =>
      bridgeManifestSchema.parse({
        ...validManifest,
        capabilities: ["unknown"],
      })
    ).toThrow();
  });
});

describe("bridgeErrorResponseSchema", () => {
  it("accepts minimal error response", () => {
    const error = { ok: false, error: "Connection failed" };

    expect(bridgeErrorResponseSchema.parse(error)).toEqual(error);
  });

  it("accepts full error response", () => {
    const error = {
      ok: false,
      error: "Rate limited",
      code: "RATE_LIMIT",
      retryable: true,
    };

    expect(bridgeErrorResponseSchema.parse(error)).toEqual(error);
  });

  it("rejects ok: true", () => {
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

  it("accepts valid sync state", () => {
    expect(syncStateSchema.parse(validState)).toEqual(validState);
  });

  it("rejects non-ISO lastSeen", () => {
    expect(() =>
      syncStateSchema.parse({ ...validState, lastSeen: "yesterday" })
    ).toThrow();
  });

  it("rejects non-positive protocolVersion", () => {
    expect(() =>
      syncStateSchema.parse({ ...validState, protocolVersion: 0 })
    ).toThrow();
  });

  it("rejects invalid capability in array", () => {
    expect(() =>
      syncStateSchema.parse({
        ...validState,
        capabilities: ["delete:workouts"],
      })
    ).toThrow();
  });
});
