import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { IntegrationPolicyDirection } from "../types/integration-policy";
import {
  eligibleBridgeIds,
  INTEGRATION_REGISTRY,
  KNOWN_BRIDGE_IDS,
} from "./integration-registry";

// Real announced capability tokens, mirroring each bridge's manifest
// (background.js / kaiord-announce.js CAPABILITIES). `read:activities` is
// intentionally omitted from GARMIN_CAPS here to keep the F1.3b activity-import
// assertion meaningful; the authoritative full-manifest parity check lives in
// integration-registry-capability-parity.test.ts.
const GARMIN_CAPS = ["write:workouts", "write:body"];
const WHOOP_CAPS = ["read:body", "read:sleep"];
const TRAIN2GO_CAPS = ["read:training-plan", "read:training-zones"];
const TANITA_CAPS = ["read:body"];
const TRAININGPEAKS_CAPS = ["read:body", "write:body"];

const realCapabilities = (bridgeId: string): readonly string[] => {
  if (bridgeId === "garmin-bridge") return GARMIN_CAPS;
  if (bridgeId === "whoop-bridge") return WHOOP_CAPS;
  if (bridgeId === "train2go-bridge") return TRAIN2GO_CAPS;
  if (bridgeId === "tanita-bridge") return TANITA_CAPS;
  if (bridgeId === "trainingpeaks-bridge") return TRAININGPEAKS_CAPS;
  return [];
};

describe("INTEGRATION_REGISTRY", () => {
  it.each([
    { id: "train2go", mechanism: "bridge", bridgeId: "train2go-bridge" },
    { id: "manual", mechanism: "manual", bridgeId: null },
  ])(
    "should declare $id as a $mechanism integration bound to $bridgeId",
    ({ id, mechanism, bridgeId }) => {
      // Arrange

      // Act
      const entry = INTEGRATION_REGISTRY.find((e) => e.id === id);

      // Assert
      expect(entry).toMatchObject({ mechanism, bridgeId });
    }
  );

  // Backs the athlete-connections spec scenario "Mechanism per current
  // provider". It was pinned on the Athlete page's own CONNECTIONS catalog
  // until that catalog was retired; the registry is now the only one left.
  it.each([
    { id: "garmin", mechanism: "bridge" },
    { id: "whoop", mechanism: "bridge" },
    { id: "train2go", mechanism: "bridge" },
    { id: "trainingpeaks", mechanism: "bridge" },
    { id: "tanita", mechanism: "bridge" },
    { id: "intervals", mechanism: "api-key" },
    { id: "strava", mechanism: "not-supported" },
    { id: "wahoo", mechanism: "not-supported" },
    { id: "manual", mechanism: "manual" },
  ])("should declare $id as $mechanism", ({ id, mechanism }) => {
    // Arrange

    // Act
    const entry = INTEGRATION_REGISTRY.find((e) => e.id === id);

    // Assert
    expect(entry?.mechanism).toBe(mechanism);
  });

  it("should give every registry entry a mechanism", () => {
    // Arrange

    // Act
    const missing = INTEGRATION_REGISTRY.filter(
      (entry) => entry.mechanism === undefined
    );

    // Assert
    expect(missing).toEqual([]);
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
  it("should include every bridge-mechanism integration, including whoop and tanita", () => {
    // Arrange
    const expectedBridgeIds = [
      "garmin-bridge",
      "whoop-bridge",
      "train2go-bridge",
      "tanita-bridge",
      "trainingpeaks-bridge",
    ];

    // Act

    // Assert
    expect(KNOWN_BRIDGE_IDS).toEqual(expect.arrayContaining(expectedBridgeIds));
    expect(KNOWN_BRIDGE_IDS).toHaveLength(expectedBridgeIds.length);
  });
});

describe("eligibleBridgeIds", () => {
  it.each([
    {
      dataType: "planned-session" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: ["train2go-bridge"],
    },
    {
      dataType: "workout" as ManagedDataType,
      direction: "export" as IntegrationPolicyDirection,
      expected: ["garmin-bridge"],
    },
    {
      dataType: "body-composition" as ManagedDataType,
      direction: "export" as IntegrationPolicyDirection,
      expected: ["garmin-bridge"],
    },
    // `read:body` is shared, so trainingpeaks-bridge announces it too — but it
    // only serves the weight channel, so it must stay out of body-composition.
    {
      dataType: "body-composition" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: ["tanita-bridge", "whoop-bridge"],
    },
    {
      dataType: "weight" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: ["tanita-bridge", "trainingpeaks-bridge", "whoop-bridge"],
    },
    // "planned-session" declares no export token at all.
    {
      dataType: "planned-session" as ManagedDataType,
      direction: "export" as IntegrationPolicyDirection,
      expected: [],
    },
    // F1.3b: train2go-bridge never announces read:activities, and no other
    // bridge does either.
    {
      dataType: "activity" as ManagedDataType,
      direction: "import" as IntegrationPolicyDirection,
      expected: [],
    },
  ])(
    "should offer only $expected for $dataType $direction",
    ({ dataType, direction, expected }) => {
      // Arrange

      // Act
      const result = eligibleBridgeIds(dataType, direction, realCapabilities);

      // Assert
      expect([...result].sort()).toEqual(expected);
    }
  );
});
