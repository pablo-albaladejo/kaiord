import { describe, expect, it } from "vitest";

import {
  eligibleBridgeIds,
  INTEGRATION_REGISTRY,
  KNOWN_BRIDGE_IDS,
} from "./integration-registry";

// Real announced capability tokens, mirroring each bridge's manifest
// (background.js / kaiord-announce.js CAPABILITIES).
const GARMIN_CAPS = ["write:workouts"];
const WHOOP_CAPS = ["read:body", "read:sleep"];
const TRAIN2GO_CAPS = ["read:training-plan", "read:training-zones"];

const realCapabilities = (bridgeId: string): readonly string[] => {
  if (bridgeId === "garmin-bridge") return GARMIN_CAPS;
  if (bridgeId === "whoop-bridge") return WHOOP_CAPS;
  if (bridgeId === "train2go-bridge") return TRAIN2GO_CAPS;
  return [];
};

describe("INTEGRATION_REGISTRY", () => {
  it("should give every entry a mechanism and an id", () => {
    // Arrange

    // Act
    const missing = INTEGRATION_REGISTRY.filter(
      (entry) => !entry.id || !entry.mechanism
    );

    // Assert
    expect(missing).toEqual([]);
  });

  it("should declare train2go as a visible bridge integration", () => {
    // Arrange

    // Act
    const train2go = INTEGRATION_REGISTRY.find((e) => e.id === "train2go");

    // Assert
    expect(train2go?.mechanism).toBe("bridge");
    expect(train2go?.bridgeId).toBe("train2go-bridge");
  });

  it("should declare manual as an always-active, bridge-less mechanism", () => {
    // Arrange

    // Act
    const manual = INTEGRATION_REGISTRY.find((e) => e.id === "manual");

    // Assert
    expect(manual?.mechanism).toBe("manual");
    expect(manual?.bridgeId).toBeNull();
  });

  it("should require no bridge id for non-bridge mechanisms", () => {
    // Arrange

    // Act
    const nonBridge = INTEGRATION_REGISTRY.filter(
      (entry) => entry.mechanism !== "bridge"
    );

    // Assert
    expect(nonBridge.every((entry) => entry.bridgeId === null)).toBe(true);
  });
});

describe("KNOWN_BRIDGE_IDS", () => {
  it("should include every bridge-mechanism integration, including whoop", () => {
    // Arrange
    const expectedBridgeIds = ["garmin-bridge", "whoop-bridge", "train2go-bridge"];

    // Act

    // Assert
    expect(KNOWN_BRIDGE_IDS).toEqual(expect.arrayContaining(expectedBridgeIds));
    expect(KNOWN_BRIDGE_IDS).toHaveLength(expectedBridgeIds.length);
  });
});

describe("eligibleBridgeIds", () => {
  it("should only include bridges that actually announce the required capability token", () => {
    // Arrange
    // "planned-session" import requires read:training-plan — only
    // train2go-bridge announces it; garmin/whoop never do.

    // Act
    const result = eligibleBridgeIds(
      "planned-session",
      "import",
      realCapabilities
    );

    // Assert
    expect(result).toEqual(["train2go-bridge"]);
  });

  it("should offer garmin-bridge for workout export (write:workouts) but not train2go-bridge", () => {
    // Arrange

    // Act
    const result = eligibleBridgeIds("workout", "export", realCapabilities);

    // Assert
    expect(result).toEqual(["garmin-bridge"]);
  });

  it("should return an empty list for a direction the data type has no capability token for", () => {
    // Arrange
    // "planned-session" only declares an import capability.

    // Act
    const result = eligibleBridgeIds(
      "planned-session",
      "export",
      realCapabilities
    );

    // Assert
    expect(result).toEqual([]);
  });

  it("should exclude train2go-bridge from activity import — it never announces read:activities (F1.3b)", () => {
    // Arrange
    // train2go-bridge only ever announces read:training-plan and
    // read:training-zones; it has no execution/activity capability.

    // Act
    const result = eligibleBridgeIds("activity", "import", realCapabilities);

    // Assert
    expect(result).not.toContain("train2go-bridge");
    expect(result).toEqual([]);
  });
});
