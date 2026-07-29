import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DataTypeSourcePolicy } from "../../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../../types/integration-policy";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { DataTypeRoutingSection } from "./DataTypeRoutingSection";

const state = vi.hoisted(() => ({
  policies: [] as DataTypeSourcePolicy[],
  syncedAt: new Map<string, string | undefined>(),
}));

vi.mock("../../../contexts/persistence-context", () => ({
  usePersistence: () => ({}),
}));
vi.mock("../../../hooks/data-hub/use-bridge-sync-states", () => ({
  useBridgeSyncStates: () => state.syncedAt,
}));
vi.mock("../../../hooks/data-hub/use-data-type-source-policies", () => ({
  useDataTypeSourcePolicies: () => state.policies,
}));

const route = (bridgeId: string, enabled = true): IntegrationPolicy =>
  ({ bridgeId, enabled }) as IntegrationPolicy;

const flows = (
  entries: Partial<
    Record<
      ManagedDataType,
      { import?: IntegrationPolicy[]; export?: IntegrationPolicy[] }
    >
  >
): DataFlowsByType =>
  new Map(
    Object.entries(entries).map(([dataType, value]) => [
      dataType as ManagedDataType,
      { import: value?.import ?? [], export: value?.export ?? [] },
    ])
  );

const renderSection = (byDataType: DataFlowsByType = flows({})) =>
  render(<DataTypeRoutingSection profileId="p1" byDataType={byDataType} />);

describe("DataTypeRoutingSection", () => {
  beforeEach(() => {
    state.policies = [];
    state.syncedAt = new Map();
  });

  it("should render every managed data type inside one of the three groups", () => {
    // Arrange
    // The grouping is SPA-side; this pins that the page renders the whole
    // domain list rather than the subset someone remembered to add.
    renderSection();

    // Act
    const rows = managedDataTypes.map((dataType) =>
      screen.queryByTestId(`routing-row-${dataType}`)
    );

    // Assert
    expect(rows.filter(Boolean)).toHaveLength(managedDataTypes.length);
    for (const group of ["training", "recovery", "body"]) {
      expect(screen.getByTestId(`routing-group-${group}`)).toBeInTheDocument();
    }
  });

  it("should count union-mode sources instead of naming one of them", () => {
    // Arrange
    // One enabled Garmin route on a type that also has a manual path, with no
    // stored policy — the DEFAULT union mode, which has no winner. This is the
    // exact row on which the reference design shows a confident "From: Garmin".
    renderSection(flows({ sleep: { import: [route("garmin-bridge")] } }));

    // Act
    const pill = screen.getByTestId("routing-from-sleep");

    // Assert
    expect(pill).toHaveTextContent("2 sources");
    expect(pill).not.toHaveTextContent("Garmin");
  });

  it("should offer an export target only on a type that can be exported", () => {
    // Arrange
    // `planned-session` has no export capability at all, so "Nowhere" would
    // describe a route that cannot exist; `workout` has one and can honestly
    // report that none is switched on.
    renderSection();

    // Act
    const plannedRow = screen.getByTestId("routing-row-planned-session");
    const workoutRow = screen.getByTestId("routing-row-workout");

    // Assert
    expect(plannedRow).not.toHaveTextContent("Also sent to");
    expect(workoutRow).toHaveTextContent("Also sent to");
    expect(workoutRow).toHaveTextContent("Nowhere");
  });

  it("should date a row by its source rather than by the data type", () => {
    // Arrange
    // `coachingSyncState` is keyed by (source, profile) and holds no data
    // type, so the only true sentence names the source. Train2Go is a
    // single-source row: `planned-session` has no manual path to add a second.
    state.syncedAt = new Map([["train2go", new Date().toISOString()]]);
    renderSection(
      flows({ "planned-session": { import: [route("train2go-bridge")] } })
    );

    // Act
    const row = screen.getByTestId("routing-row-planned-session");

    // Assert
    expect(row).toHaveTextContent("Train2Go last sent data just now");
  });

  it("should show no time for a source that has never written a sync row", () => {
    // Arrange
    // Manual entry never writes to `coachingSyncState`, so there is no
    // timestamp to render and none is invented.
    renderSection();

    // Act
    const row = screen.getByTestId("routing-row-stress");

    // Assert
    expect(row).toHaveTextContent("Manual Entry");
    expect(
      screen.queryByTestId("routing-synced-manual")
    ).not.toBeInTheDocument();
  });
});
