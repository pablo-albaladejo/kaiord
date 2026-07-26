import { describe, expect, it } from "vitest";

import { BRIDGE_SYNC_SOURCES, syncSourceFor } from "./bridge-sync-sources";
import { KNOWN_BRIDGE_IDS } from "./integration-registry";

describe("BRIDGE_SYNC_SOURCES", () => {
  it("should map every known bridge id", () => {
    // Arrange
    const mapped = Object.keys(BRIDGE_SYNC_SOURCES);

    // Act
    const missing = KNOWN_BRIDGE_IDS.filter((id) => !mapped.includes(id));

    // Assert
    expect(missing).toEqual([]);
  });

  it("should keep the historical train2go key", () => {
    // Arrange
    const bridgeId = "train2go-bridge";

    // Act
    const source = syncSourceFor(bridgeId);

    // Assert
    expect(source).toBe("train2go");
  });

  it("should use the bridge id verbatim for every other bridge", () => {
    // Arrange
    const others = KNOWN_BRIDGE_IDS.filter((id) => id !== "train2go-bridge");

    // Act
    const drifted = others.filter((id) => syncSourceFor(id) !== id);

    // Assert
    expect(drifted).toEqual([]);
  });

  it("should fall back to the bridge id for an unmapped bridge", () => {
    // Arrange
    const bridgeId = "future-bridge";

    // Act
    const source = syncSourceFor(bridgeId);

    // Assert
    expect(source).toBe("future-bridge");
  });
});
