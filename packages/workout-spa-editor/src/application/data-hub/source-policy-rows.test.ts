import { describe, expect, it } from "vitest";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import {
  buildSourcePolicyRows,
  orderSources,
  reorderSources,
} from "./source-policy-rows";

const NOW = "2026-05-01T00:00:00.000Z";
const PID = "00000000-0000-4000-8000-000000000001";

const pol = (bridgeId: string, enabled: boolean): IntegrationPolicy => ({
  id: `id-${bridgeId}`,
  profileId: PID,
  dataType: "sleep",
  bridgeId,
  direction: "import",
  mode: "auto",
  enabled,
  updatedAt: NOW,
});

const flows = (imports: IntegrationPolicy[]): DataFlowsByType =>
  new Map([["sleep", { import: imports, export: [] }]]);

describe("buildSourcePolicyRows", () => {
  it("should skip a data type with fewer than two enabled sources", () => {
    // Arrange
    const byDataType = flows([pol("garmin-bridge", true), pol("whoop-bridge", false)]);

    // Act
    const rows = buildSourcePolicyRows(byDataType, []);

    // Assert
    expect(rows).toHaveLength(0);
  });

  it("should include a two-source type defaulting to union", () => {
    // Arrange
    const byDataType = flows([pol("garmin-bridge", true), pol("whoop-bridge", true)]);

    // Act
    const rows = buildSourcePolicyRows(byDataType, []);

    // Assert
    expect(rows).toHaveLength(1);
    expect(rows[0]?.mode).toBe("union");
    expect(rows[0]?.sourceOrder).toEqual(["garmin-bridge", "whoop-bridge"]);
  });

  it("should honour a saved priority order and append new sources", () => {
    // Arrange
    const byDataType = flows([
      pol("garmin-bridge", true),
      pol("whoop-bridge", true),
    ]);
    const saved: DataTypeSourcePolicy[] = [
      { profileId: PID, dataType: "sleep", mode: "priority", sourceOrder: ["whoop-bridge"] },
    ];

    // Act
    const rows = buildSourcePolicyRows(byDataType, saved);

    // Assert
    expect(rows[0]?.mode).toBe("priority");
    expect(rows[0]?.sourceOrder).toEqual(["whoop-bridge", "garmin-bridge"]);
  });
});

describe("orderSources", () => {
  it("should drop stale saved sources and keep only live ones", () => {
    // Arrange

    // Act
    const order = orderSources(["a", "b"], ["c", "b", "a"]);

    // Assert
    expect(order).toEqual(["b", "a"]);
  });
});

describe("reorderSources", () => {
  it("should swap a source with its neighbour", () => {
    // Arrange

    // Act
    const order = reorderSources(["a", "b", "c"], "b", -1);

    // Assert
    expect(order).toEqual(["b", "a", "c"]);
  });

  it("should leave the order unchanged at a boundary", () => {
    // Arrange

    // Act
    const order = reorderSources(["a", "b", "c"], "a", -1);

    // Assert
    expect(order).toEqual(["a", "b", "c"]);
  });
});
