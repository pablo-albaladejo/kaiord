import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { RouteToggleSignals } from "./data-type-route-toggles";
import { optionsByType, togglesByType } from "./routing-by-type";
import type { SourceCapabilitySignals } from "./source-of-truth-options";

const signals = (
  announced: Record<string, readonly string[]> = {}
): SourceCapabilitySignals & RouteToggleSignals => ({
  capabilitiesFor: (bridgeId) => announced[bridgeId] ?? null,
  announces: (bridgeId, token) => (announced[bridgeId] ?? []).includes(token),
  supportsRoute: bridgeSupportsRoute,
  isBridgeConnected: (bridgeId) => bridgeId in announced,
});

const flows = (
  entries: Partial<Record<ManagedDataType, IntegrationPolicy[]>>
): DataFlowsByType =>
  new Map(
    Object.entries(entries).map(([dataType, imports]) => [
      dataType as ManagedDataType,
      { import: imports ?? [], export: [] },
    ])
  );

const route = (bridgeId: string): IntegrationPolicy =>
  ({ bridgeId, enabled: true }) as IntegrationPolicy;

describe("optionsByType", () => {
  it("should answer for every managed type, not only the ones with a policy", () => {
    // Arrange
    // The rows are rendered from `managedDataTypes`, so a map keyed off the
    // stored policies would leave exactly the types that have no source — the
    // ones that most need a control — with no entry at all.
    const policies = [
      { dataType: "weight", mode: "priority", sourceOrder: [] },
    ] as DataTypeSourcePolicy[];

    // Act
    const options = optionsByType(flows({}), policies, signals());

    // Assert
    expect(options.size).toBe(managedDataTypes.length);
    expect(options.get("sleep")).toBeDefined();
  });

  it("should give each type its own stored policy", () => {
    // Arrange
    // One ranked type beside an unranked one. A lookup that reached the wrong
    // row would report the ranking on a type the user never ranked.
    const policies = [
      {
        dataType: "weight",
        mode: "priority",
        sourceOrder: ["tanita-bridge"],
      },
    ] as DataTypeSourcePolicy[];

    // Act
    const options = optionsByType(flows({}), policies, signals());

    // Assert
    expect(options.get("weight")?.mode).toBe("priority");
    expect(options.get("sleep")?.mode).toBe("union");
  });
});

describe("togglesByType", () => {
  it("should answer for every managed type, not only the ones with flows", () => {
    // Arrange
    // Same reason: an extension installed today has no policy row anywhere, so
    // its types are absent from `byDataType` — and those are precisely the rows
    // whose control has to appear.
    const announced = { "whoop-bridge": ["read:sleep"] };

    // Act
    const toggles = togglesByType(
      flows({}),
      INTEGRATION_REGISTRY,
      signals(announced)
    );

    // Assert
    expect(toggles.size).toBe(managedDataTypes.length);
    expect(toggles.get("sleep")).toEqual([
      { bridgeId: "whoop-bridge", integrationId: "whoop", enabled: false },
    ]);
  });

  it("should read each type's own import routes", () => {
    // Arrange
    // WHOOP is offerable for both types; only sleep has the route switched on.
    // A lookup that ignored the key would report both the same.
    const announced = { "whoop-bridge": ["read:sleep", "read:body"] };
    const byDataType = flows({ sleep: [route("whoop-bridge")] });

    // Act
    const toggles = togglesByType(
      byDataType,
      INTEGRATION_REGISTRY,
      signals(announced)
    );

    // Assert
    expect(toggles.get("sleep")?.[0]?.enabled).toBe(true);
    expect(toggles.get("hrv")?.[0]?.enabled).toBe(false);
  });
});
