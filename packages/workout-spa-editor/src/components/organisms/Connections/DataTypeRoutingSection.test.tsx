import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DataTypeSourcePolicy } from "../../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../../types/integration-policy";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { DataTypeRoutingSection } from "./DataTypeRoutingSection";

const state = vi.hoisted(() => ({
  policies: [] as DataTypeSourcePolicy[],
  syncedAt: new Map<string, string | undefined>(),
  put: vi.fn(),
}));

vi.mock("../../../contexts/persistence-context", () => ({
  usePersistence: () => ({ dataTypeSourcePolicy: { put: state.put } }),
}));
vi.mock("../../../hooks/data-hub/use-bridge-sync-states", () => ({
  useBridgeSyncStates: () => state.syncedAt,
}));
vi.mock("../../../hooks/data-hub/use-data-type-source-policies", () => ({
  useDataTypeSourcePolicies: () => state.policies,
}));
// Discovery is not running in jsdom, so `getCapabilities` answers null for
// every bridge — the "not verified yet" branch, which offers every enabled
// route. The capability REFUSAL is covered where the signals can be injected,
// in source-of-truth-options.test.ts.
vi.mock("../../../hooks/use-bridge-connections", () => ({
  useBridgeConnections: () => [],
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
    state.put = vi.fn();
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

  it("should offer no change on a row with a single source under the default mode", () => {
    // Arrange
    // The profile that has linked nothing: `stress` has manual entry and no
    // enabled import route, so there is no second way to read it. A control
    // here could only flip the mode without changing what is read.
    renderSection();

    // Act
    const row = screen.getByTestId("routing-row-stress");

    // Assert
    expect(row).toHaveAttribute("data-origin", "only");
    expect(
      screen.queryByTestId("routing-change-stress")
    ).not.toBeInTheDocument();
  });

  it("should say that picking a source changes how the type is read, before anything is stored", () => {
    // Arrange
    // Writer: the Data Hub sleep/WHOOP import cell. Two sources under the
    // DEFAULT union mode, so picking one really does change the read
    // semantics — the row must say so while nothing has been written yet.
    renderSection(flows({ sleep: { import: [route("whoop-bridge")] } }));

    // Act
    fireEvent.click(screen.getByTestId("routing-change-sleep"));
    const panel = screen.getByTestId("routing-picker-sleep");

    // Assert
    expect(panel).toHaveTextContent(
      "keeps every source's Sleep and ranks none"
    );
    expect(panel).toHaveTextContent(
      "use the others only on days it has nothing"
    );
    expect(panel).toHaveTextContent("go back to keeping every source");
    expect(state.put).not.toHaveBeenCalled();
  });

  it("should store a ranked order led by the picked source", () => {
    // Arrange
    // Writer: two Data Hub weight import cells (WHOOP and Tanita both announce
    // read:body and both serve weight), union by default. Tanita is picked
    // second on purpose: an order stored in candidate sequence would still
    // look correct if the pick already happened to lead it.
    renderSection(
      flows({
        weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
      })
    );
    fireEvent.click(screen.getByTestId("routing-change-weight"));

    // Act
    fireEvent.click(screen.getByTestId("routing-choice-weight-tanita-bridge"));

    // Assert
    // Every other source stays in the order behind it: they remain fallbacks
    // rather than being dropped from a type they can still serve.
    expect(state.put).toHaveBeenCalledWith({
      profileId: "p1",
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["tanita-bridge", "whoop-bridge", "manual"],
    });
  });

  it("should offer the way back to keeping every source from a ranked row", () => {
    // Arrange
    // Writer: this control, or the Data Hub priority editor, having ranked
    // weight. Returning to union must clear the order too — a surviving
    // ranking would decide the row again the moment the mode flipped back.
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
    fireEvent.click(screen.getByTestId("routing-change-weight"));

    // Act
    fireEvent.click(screen.getByTestId("routing-choice-weight-union"));

    // Assert
    expect(state.put).toHaveBeenCalledWith({
      profileId: "p1",
      dataType: "weight",
      mode: "union",
      sourceOrder: [],
    });
  });

  it("should not warn about a change of meaning on a row that is already ranked", () => {
    // Arrange
    // Same ranked weight row. Reordering a ranked type changes which source
    // leads and nothing else, so repeating the union warning here would be
    // describing a consequence that cannot happen.
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
    fireEvent.click(screen.getByTestId("routing-change-weight"));
    const panel = screen.getByTestId("routing-picker-weight");

    // Assert
    expect(panel).toHaveTextContent("reads Weight from Tanita first");
    expect(panel).not.toHaveTextContent("ranks none of them");
    expect(
      screen.getByTestId("routing-choice-weight-tanita-bridge")
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("should let a row that is ranked to nothing available pick a source that works", () => {
    // Arrange
    // Writer: chat `set_source_policy stress priority ["garmin"]` — it
    // resolves, so no writer guard stops it, but a Garmin stress import can
    // never be enabled and the resolver reads nothing. This is the one row
    // Wave 2a could only report; it must now be fixable.
    state.policies = [
      {
        dataType: "stress",
        mode: "priority",
        sourceOrder: ["garmin-bridge"],
      } as DataTypeSourcePolicy,
    ];
    renderSection();
    fireEvent.click(screen.getByTestId("routing-change-stress"));

    // Act
    fireEvent.click(screen.getByTestId("routing-choice-stress-manual"));

    // Assert
    expect(state.put).toHaveBeenCalledWith({
      profileId: "p1",
      dataType: "stress",
      mode: "priority",
      sourceOrder: ["manual"],
    });
  });
});
