/**
 * Registry ↔ real bridge manifest parity.
 *
 * Reads `capabilities` straight out of each bridge's own
 * `background.js` BRIDGE_MANIFEST (the source of truth a real browser
 * extension announces) instead of hardcoding a mirror of those values,
 * so a manifest edit that isn't reflected here fails loudly rather than
 * silently drifting from `eligibleBridgeIds`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { eligibleBridgeIds } from "./integration-registry";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGES_ROOT = join(HERE, "..", "..", "..");

function readManifestCapabilities(bridgePackage: string): readonly string[] {
  const source = readFileSync(
    join(PACKAGES_ROOT, bridgePackage, "background.js"),
    "utf-8"
  );
  const match = /capabilities:\s*(\[[^\]]*\])/.exec(source);
  if (!match) {
    throw new Error(`No BRIDGE_MANIFEST.capabilities found in ${bridgePackage}`);
  }
  return JSON.parse(match[1]) as string[];
}

describe("integration registry — real bridge manifest parity", () => {
  const garminCaps = readManifestCapabilities("garmin-bridge");
  const whoopCaps = readManifestCapabilities("whoop-bridge");
  const train2goCaps = readManifestCapabilities("train2go-bridge");

  const capabilitiesFor = (bridgeId: string): readonly string[] => {
    if (bridgeId === "garmin-bridge") return garminCaps;
    if (bridgeId === "whoop-bridge") return whoopCaps;
    if (bridgeId === "train2go-bridge") return train2goCaps;
    return [];
  };

  it("should make garmin-bridge eligible for workout export via its real write:workouts capability", () => {
    // Arrange

    // Act
    const result = eligibleBridgeIds("workout", "export", capabilitiesFor);

    // Assert
    expect(result).toContain("garmin-bridge");
  });

  it("should make whoop-bridge eligible for hrv and sleep import via its real capabilities", () => {
    // Arrange

    // Act
    const hrv = eligibleBridgeIds("hrv", "import", capabilitiesFor);
    const sleep = eligibleBridgeIds("sleep", "import", capabilitiesFor);

    // Assert
    expect(hrv).toContain("whoop-bridge");
    expect(sleep).toContain("whoop-bridge");
  });

  it("should make train2go-bridge eligible for planned-session import via its real read:training-plan capability", () => {
    // Arrange

    // Act
    const result = eligibleBridgeIds(
      "planned-session",
      "import",
      capabilitiesFor
    );

    // Assert
    expect(result).toEqual(["train2go-bridge"]);
  });

  it("should keep train2go-bridge ineligible for activity import — its real manifest has no execution capability (F1.3b)", () => {
    // Arrange

    // Act
    const result = eligibleBridgeIds("activity", "import", capabilitiesFor);

    // Assert
    expect(result).not.toContain("train2go-bridge");
    expect(train2goCaps).not.toContain("read:activities");
  });
});
