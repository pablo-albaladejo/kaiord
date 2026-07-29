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
    // WHOOP is the only bridge announcing `read:sleep`; with the manual path
    // that is two sources under the DEFAULT union mode, which has no winner.
    // This is the exact row on which the design shows "From: Garmin".
    renderSection(flows({ sleep: { import: [route("whoop-bridge")] } }));

    // Act
    const pill = screen.getByTestId("routing-from-sleep");

    // Assert
    expect(pill).toHaveTextContent("2 sources");
    expect(pill).not.toHaveTextContent("WHOOP");
    expect(screen.getByTestId("routing-note-sleep")).toHaveTextContent(
      "none ranked first"
    );
  });

  it("should date a primary row by its head, not by another ranked source", () => {
    // Arrange
    // Both sources have a sync row, with different times. A regression that
    // dated the row from `sources[0]` — or from whichever entry the map yields
    // first — would show WHOOP's instead of the ranked head's.
    state.syncedAt = new Map([
      ["whoop", "2026-07-29T09:00:00.000Z"],
      ["tanita", new Date().toISOString()],
    ]);
    state.policies = [
      {
        dataType: "weight",
        mode: "priority",
        sourceOrder: ["tanita-bridge", "whoop-bridge"],
      } as DataTypeSourcePolicy,
    ];
    renderSection(
      flows({
        weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
      })
    );

    // Act
    const row = screen.getByTestId("routing-row-weight");

    // Assert
    expect(row).toHaveTextContent("Tanita last sent data just now");
    expect(
      screen.queryByTestId("routing-synced-whoop")
    ).not.toBeInTheDocument();
  });

  it("should date no row that has no single owning source", () => {
    // Arrange
    // Both union-mode sources have a recorded sync, so a regression that
    // started dating an unranked row from any of them would render a time
    // here. The empty-map version of this test could not have caught it.
    state.syncedAt = new Map([
      ["whoop", new Date().toISOString()],
      ["tanita", new Date().toISOString()],
    ]);
    renderSection(
      flows({
        weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
      })
    );

    // Act
    const row = screen.getByTestId("routing-row-weight");

    // Assert
    expect(row).toHaveAttribute("data-origin", "unranked");
    expect(row).not.toHaveTextContent("last sent data");
  });

  it("should report a ranked row whose sources are all switched off", () => {
    // Arrange
    // Chat can set stress priority to ["garmin"] — it resolves — but Garmin
    // announces no `read:body`, so that import can never be enabled. The
    // resolver returns NOTHING for stress; naming manual entry would say the
    // opposite of what the user experiences on Daily.
    state.policies = [
      {
        dataType: "stress",
        mode: "priority",
        sourceOrder: ["garmin-bridge"],
      } as DataTypeSourcePolicy,
    ];
    renderSection();

    // Act
    const row = screen.getByTestId("routing-row-stress");

    // Assert
    expect(row).toHaveAttribute("data-origin", "rankedUnavailable");
    expect(row).not.toHaveTextContent("Manual Entry");
    expect(screen.getByTestId("routing-note-stress")).toHaveTextContent(
      "nothing is being read"
    );
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
    // Manual entry never writes to `coachingSyncState`. Other sources DO have
    // times here, so a regression that fell back to any available timestamp
    // would surface rather than being masked by an empty map.
    state.syncedAt = new Map([["whoop", new Date().toISOString()]]);
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
