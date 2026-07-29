import { describe, expect, it } from "vitest";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import {
  type BridgeSessionSignal,
  bridgeSourceStatus,
  sourceStatus,
} from "./connection-source-status";

const CHECKED_AT = 1_700_000_000_000;

const session = (
  over: Partial<BridgeSessionSignal> = {}
): BridgeSessionSignal =>
  ({
    sessionActive: true,
    checking: false,
    error: null,
    needsReauth: false,
    lastCheckedAt: CHECKED_AT,
    ...over,
  }) satisfies BridgeSessionSignal;

const entry = (
  mechanism: IntegrationRegistryEntry["mechanism"]
): IntegrationRegistryEntry => ({
  id: "x",
  name: "X",
  mark: "X",
  mechanism,
  bridgeId: mechanism === "bridge" ? "x-bridge" : null,
});

describe("bridgeSourceStatus", () => {
  it("should report a live session as connected", () => {
    // Arrange
    const state = session();

    // Act
    const result = bridgeSourceStatus(state, true);

    // Assert
    expect(result).toBe("connected");
  });

  it("should report a never-probed discovered bridge as installed", () => {
    // Arrange
    // The refresh pass writes exactly this for a bridge with no prober:
    // discovered, not checking, never checked. Tanita is that bridge.
    const state = session({ sessionActive: false, lastCheckedAt: null });

    // Act
    const result = bridgeSourceStatus(state, true);

    // Assert
    expect(result).toBe("installed");
  });

  it("should report an in-flight probe as checking, not installed", () => {
    // Arrange
    const state = session({ checking: true, lastCheckedAt: null });

    // Act
    const result = bridgeSourceStatus(state, true);

    // Assert
    expect(result).toBe("checking");
  });

  it("should report a probed but inactive session as needing attention", () => {
    // Arrange
    const state = session({ sessionActive: false });

    // Act
    const result = bridgeSourceStatus(state, true);

    // Assert
    expect(result).toBe("attention");
  });

  it("should report a probe error as needing attention", () => {
    // Arrange
    const state = session({ error: "boom" });

    // Act
    const result = bridgeSourceStatus(state, true);

    // Assert
    expect(result).toBe("attention");
  });

  it("should report an unlinked bridge as available whatever its session says", () => {
    // Arrange
    const state = session();

    // Act
    const result = bridgeSourceStatus(state, false);

    // Assert
    expect(result).toBe("available");
  });
});

describe("sourceStatus", () => {
  it("should report manual entry as always on and unsupported brands as such", () => {
    // Arrange
    const manual = entry("manual");
    const strava = entry("not-supported");

    // Act
    const manualStatus = sourceStatus(manual, undefined, false);
    const stravaStatus = sourceStatus(strava, undefined, false);

    // Assert
    expect(manualStatus).toBe("manual");
    expect(stravaStatus).toBe("unsupported");
  });

  it("should map an api-key provider straight onto its connection record", () => {
    // Arrange
    const intervals = entry("api-key");

    // Act
    const linked = sourceStatus(intervals, undefined, true);
    const unlinked = sourceStatus(intervals, undefined, false);

    // Assert
    expect(linked).toBe("connected");
    expect(unlinked).toBe("available");
  });
});
