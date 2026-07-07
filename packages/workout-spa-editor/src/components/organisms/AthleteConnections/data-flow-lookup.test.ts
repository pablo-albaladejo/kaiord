import { describe, expect, it } from "vitest";

import type { IntegrationPolicy } from "../../../types/integration-policy";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { bridgePolicies } from "./data-flow-lookup";

const BRIDGE = "garmin-bridge";

function policy(over: Partial<IntegrationPolicy>): IntegrationPolicy {
  return {
    id: "id-1",
    profileId: "p1",
    dataType: "workout",
    bridgeId: BRIDGE,
    direction: "import",
    mode: "manual",
    enabled: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function flowsMap(policies: IntegrationPolicy[]): DataFlowsByType {
  const map: DataFlowsByType = new Map();
  map.set("workout", { import: policies, export: [] });
  return map;
}

describe("bridgePolicies", () => {
  it("should collect only policies belonging to the bridge", () => {
    // Arrange
    const map = flowsMap([
      policy({ id: "a" }),
      policy({ id: "b", bridgeId: "other-bridge" }),
    ]);

    // Act
    const result = bridgePolicies(map, BRIDGE);

    // Assert
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });
});
