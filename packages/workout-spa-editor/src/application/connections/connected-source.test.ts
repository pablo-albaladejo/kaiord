import { describe, expect, it } from "vitest";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { ConnectionRecord } from "../../types/connection";
import { isBridgeConnected, isSourceConnected } from "./connected-source";

const NOW = "2026-07-29T00:00:00.000Z";

const record = (status: ConnectionRecord["status"]): ConnectionRecord => ({
  profileId: "p1",
  providerId: "garmin",
  status,
  mechanism: "bridge",
  updatedAt: NOW,
});

const entry = (
  over: Partial<IntegrationRegistryEntry> = {}
): IntegrationRegistryEntry => ({
  id: "garmin",
  name: "Garmin",
  mark: "G",
  mechanism: "bridge",
  bridgeId: "garmin-bridge",
  ...over,
});

const discovered = (set: readonly string[]) => (id: string) => set.includes(id);

describe("isBridgeConnected", () => {
  it("should treat a missing record as never disconnected", () => {
    // Arrange
    const noRecord = undefined;

    // Act
    const result = isBridgeConnected(true, noRecord);

    // Assert
    // Nothing writes a `connected` bridge record, so demanding one would
    // report every working bridge as available forever.
    expect(result).toBe(true);
  });

  it("should reject a discovered bridge the user disconnected", () => {
    // Arrange
    const stored = record("disconnected");

    // Act
    const result = isBridgeConnected(true, stored);

    // Assert
    expect(result).toBe(false);
  });

  it("should reject an undiscovered bridge whatever the record says", () => {
    // Arrange
    const stored = record("connected");

    // Act
    const result = isBridgeConnected(false, stored);

    // Assert
    expect(result).toBe(false);
  });
});

describe("isSourceConnected", () => {
  it("should apply the absence-tolerant rule to a bridge", () => {
    // Arrange
    const bridge = entry();

    // Act
    const result = isSourceConnected(
      bridge,
      undefined,
      discovered(["garmin-bridge"])
    );

    // Assert
    expect(result).toBe(true);
  });

  it("should require an explicit record for an api-key provider", () => {
    // Arrange
    const apiKey = entry({
      id: "intervals",
      mechanism: "api-key",
      bridgeId: null,
    });

    // Act
    const missing = isSourceConnected(apiKey, undefined, discovered([]));
    const linked = isSourceConnected(
      apiKey,
      { ...record("connected"), providerId: "intervals" },
      discovered([])
    );

    // Assert
    expect(missing).toBe(false);
    expect(linked).toBe(true);
  });

  it("should answer false for manual entry, which links no account", () => {
    // Arrange
    const manual = entry({ id: "manual", mechanism: "manual", bridgeId: null });

    // Act
    const result = isSourceConnected(manual, undefined, discovered([]));

    // Assert
    expect(result).toBe(false);
  });
});
