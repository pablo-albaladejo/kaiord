import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BridgeConnectionState } from "../../../adapters/bridge/bridge-connection-types";
import type { ConnectionRecord } from "../../../types/connection";
import type { DataTypeSourcePolicy } from "../../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../../types/integration-policy";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { DataTypeRoutingSection } from "./DataTypeRoutingSection";

// A real UUID: `upsertIntegrationPolicy` validates the profile id, so the
// route writes below would throw on the placeholder the ranking tests used.
const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";

const state = vi.hoisted(() => ({
  policies: [] as DataTypeSourcePolicy[],
  syncedAt: new Map<string, string | undefined>(),
  put: vi.fn(),
  connections: [] as unknown[],
  records: new Map<string, unknown>(),
  capabilities: new Map<string, readonly string[]>(),
  policyPut: vi.fn(),
  findByNaturalKey: vi.fn(),
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
// Discovery does not run in jsdom, so the announcement is injected here. The
// DEFAULT is an empty capability map, i.e. `getCapabilities` answers null —
// the "not verified yet" branch, which keeps every enabled route rankable while
// offering no NEW route. Both halves of that asymmetry are exercised below.
vi.mock("../../../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: {
    getCapabilities: (bridgeId: string) =>
      state.capabilities.get(bridgeId) ?? null,
  },
}));
vi.mock("../../../hooks/use-bridge-connections", () => ({
  useBridgeConnections: () => state.connections,
}));
vi.mock("../../../hooks/use-connection-status", () => ({
  useConnectionStatus: () => state.records,
}));
// The real upsert use case runs against this double, so its natural-key read,
// its schema validation and the row it composes are all under test.
// Read through `state` on every call rather than captured once: `beforeEach`
// replaces these spies, and a captured reference would keep pointing at the
// previous test's fn.
vi.mock("../../../hooks/integration-policy-repo", () => ({
  policyRepo: {
    put: (row: unknown) => state.policyPut(row),
    findByNaturalKey: (key: unknown) => state.findByNaturalKey(key),
  },
}));

const route = (bridgeId: string, enabled = true): IntegrationPolicy =>
  ({ bridgeId, enabled }) as IntegrationPolicy;

const online = (bridgeId: string, token: string): void => {
  state.connections = [{ bridgeId, discovered: true } as BridgeConnectionState];
  state.capabilities = new Map([[bridgeId, [token]]]);
};

const unlinked = (providerId: string): Map<string, ConnectionRecord> =>
  new Map([
    [providerId, { providerId, status: "disconnected" } as ConnectionRecord],
  ]);

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
  render(
    <DataTypeRoutingSection profileId={PROFILE_ID} byDataType={byDataType} />
  );

describe("DataTypeRoutingSection", () => {
  beforeEach(() => {
    state.policies = [];
    state.syncedAt = new Map();
    state.put = vi.fn();
    state.connections = [];
    state.records = new Map();
    state.capabilities = new Map();
    state.policyPut = vi.fn();
    state.findByNaturalKey = vi.fn(async () => undefined);
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
      profileId: PROFILE_ID,
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
      profileId: PROFILE_ID,
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
      profileId: PROFILE_ID,
      dataType: "stress",
      mode: "priority",
      sourceOrder: ["manual"],
    });
  });

  it("should offer a newly installed source a way to start sending a type", () => {
    // Arrange
    // The reachable regression this PR introduced: the seed migrations already
    // ran for this profile, so installing WHOOP today creates no policy row.
    // Sleep then has only the manual path, the ranking control has nothing to
    // rank, and every other route surface was retired — so without this the
    // capability exists nowhere outside the assistant.
    online("whoop-bridge", "read:sleep");
    renderSection();

    // Act
    fireEvent.click(screen.getByTestId("routing-change-sleep"));

    // Assert
    const toggle = screen.getByTestId("routing-route-sleep-whoop");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByTestId("routing-choice-sleep-whoop-bridge")
    ).not.toBeInTheDocument();
  });

  it("should switch an import route on from the row", async () => {
    // Arrange
    online("whoop-bridge", "read:sleep");
    renderSection();
    fireEvent.click(screen.getByTestId("routing-change-sleep"));

    // Act
    fireEvent.click(screen.getByTestId("routing-route-sleep-whoop"));

    // Assert
    await waitFor(() => expect(state.policyPut).toHaveBeenCalled());
    expect(state.policyPut).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: PROFILE_ID,
        dataType: "sleep",
        bridgeId: "whoop-bridge",
        direction: "import",
        enabled: true,
      })
    );
  });

  it("should switch an import route off from the row", async () => {
    // Arrange
    // The row already reads from WHOOP, so pressing the same control must turn
    // it off rather than re-assert it — an on-only control would be a one-way
    // door on a page whose only other off switch is Disconnect.
    online("whoop-bridge", "read:sleep");
    renderSection(flows({ sleep: { import: [route("whoop-bridge")] } }));
    fireEvent.click(screen.getByTestId("routing-change-sleep"));
    const toggle = screen.getByTestId("routing-route-sleep-whoop");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Act
    fireEvent.click(toggle);

    // Assert
    await waitFor(() => expect(state.policyPut).toHaveBeenCalled());
    expect(state.policyPut).toHaveBeenCalledWith(
      expect.objectContaining({ bridgeId: "whoop-bridge", enabled: false })
    );
  });

  it("should keep a route's stored mode when it is switched off", async () => {
    // Arrange
    // A `manual` route is one the user (or the assistant) said must not sync on
    // its own. Reasserting `auto` here would silently re-arm background imports
    // as a side effect of switching the route off and on again.
    state.findByNaturalKey = vi.fn(async () => ({
      id: "00000000-0000-4000-8000-0000000000b2",
      profileId: PROFILE_ID,
      dataType: "sleep",
      bridgeId: "whoop-bridge",
      direction: "import",
      mode: "manual",
      enabled: true,
      updatedAt: "2026-07-01T00:00:00.000Z",
    }));
    online("whoop-bridge", "read:sleep");
    renderSection(flows({ sleep: { import: [route("whoop-bridge")] } }));
    fireEvent.click(screen.getByTestId("routing-change-sleep"));

    // Act
    fireEvent.click(screen.getByTestId("routing-route-sleep-whoop"));

    // Assert
    // The FIRST lookup is the hook's own, and it must use this row's natural
    // key or the mode it preserves is some other route's. Asserting
    // `toHaveBeenCalledWith` would pass on the use case's own second lookup,
    // which is correct by construction and proves nothing about the hook.
    await waitFor(() => expect(state.policyPut).toHaveBeenCalled());
    expect(state.findByNaturalKey.mock.calls[0]?.[0]).toEqual({
      profileId: PROFILE_ID,
      dataType: "sleep",
      direction: "import",
      bridgeId: "whoop-bridge",
    });
    expect(state.policyPut).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "manual", enabled: false })
    );
  });

  it("should offer no route to a bridge announcing some other type's token", () => {
    // Arrange
    // Garmin is online and unrestricted by the supported-route table, so the
    // ONLY thing that keeps it off the Sleep row is its announcement. A signal
    // that answered from mere presence would light up a phantom route here.
    online("garmin-bridge", "read:workouts");
    renderSection();

    // Act
    const row = screen.getByTestId("routing-row-sleep");

    // Assert
    expect(
      screen.queryByTestId("routing-change-sleep")
    ).not.toBeInTheDocument();
    expect(row).toHaveAttribute("data-origin", "only");
  });

  it("should not offer to rank an enabled route its bridge cannot serve", () => {
    // Arrange
    // WHOOP is online and announcing, but not `read:sleep`. The enabled route
    // exists (chat `enable_route` performs no capability check), so the ranking
    // control must read the ANNOUNCEMENT rather than the policy row alone.
    online("whoop-bridge", "read:workouts");
    renderSection(flows({ sleep: { import: [route("whoop-bridge")] } }));

    // Act
    fireEvent.click(screen.getByTestId("routing-change-sleep"));

    // Assert
    // Switchable off, because the route is live and reads records; never
    // rankable, because the bridge cannot produce this type.
    expect(screen.getByTestId("routing-route-sleep-whoop")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByTestId("routing-choice-sleep-whoop-bridge")
    ).not.toBeInTheDocument();
  });

  it("should offer no route to a source the user has disconnected", () => {
    // Arrange
    // Disconnect writes the `disconnected` record keyed by INTEGRATION id while
    // discovery is keyed by BRIDGE id. A control that skipped that translation
    // would keep offering WHOOP a fresh route beside its own "Not connected"
    // card, letting one half of the page undo the other.
    online("whoop-bridge", "read:sleep");
    state.records = unlinked("whoop");
    renderSection();

    // Act
    const row = screen.getByTestId("routing-row-sleep");

    // Assert
    expect(row).not.toHaveTextContent("Change");
    expect(
      screen.queryByTestId("routing-change-sleep")
    ).not.toBeInTheDocument();
  });
});
