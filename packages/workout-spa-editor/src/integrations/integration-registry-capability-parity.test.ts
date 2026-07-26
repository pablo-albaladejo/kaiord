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

import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { IntegrationPolicyDirection } from "../types/integration-policy";
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
    throw new Error(
      `No BRIDGE_MANIFEST.capabilities found in ${bridgePackage}`
    );
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

  it.each([
    {
      bridgeId: "garmin-bridge",
      dataType: "workout" as ManagedDataType,
      direction: "export" as IntegrationPolicyDirection,
    },
    {
      bridgeId: "garmin-bridge",
      dataType: "body-composition" as ManagedDataType,
      direction: "export" as IntegrationPolicyDirection,
    },
    {
      bridgeId: "whoop-bridge",
      dataType: "hrv" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
    },
    {
      bridgeId: "whoop-bridge",
      dataType: "sleep" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
    },
    {
      bridgeId: "train2go-bridge",
      dataType: "planned-session" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
    },
  ])(
    "should make $bridgeId eligible for $dataType $direction via its real manifest capabilities",
    ({ bridgeId, dataType, direction }) => {
      // Arrange

      // Act
      const result = eligibleBridgeIds(dataType, direction, capabilitiesFor);

      // Assert
      expect(result).toContain(bridgeId);
    }
  );

  it("should keep train2go-bridge ineligible for activity import — its real manifest has no execution capability (F1.3b)", () => {
    // Arrange

    // Act
    const result = eligibleBridgeIds("activity", "import", capabilitiesFor);

    // Assert
    expect(result).not.toContain("train2go-bridge");
    expect(train2goCaps).not.toContain("read:activities");
  });
});
