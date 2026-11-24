import type { ManagedDataType } from "@kaiord/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CapabilitiesFixture } from "../../../contexts/capabilities-context";
import type { DataFlowsByType } from "../../../hooks/connections/use-data-flows";
import type { DataTypeSourcePolicy } from "../../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../../types/integration-policy";
import { AuthorityTab } from "./AuthorityTab";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000b1";

const state = vi.hoisted(() => ({
  policies: [] as DataTypeSourcePolicy[],
  byDataType: new Map() as DataFlowsByType,
  put: vi.fn(),
}));

vi.mock("../../../contexts/persistence-context", () => ({
  usePersistence: () => ({ dataTypeSourcePolicy: { put: state.put } }),
}));
vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: PROFILE_ID }),
}));
vi.mock("../../../hooks/connections/use-data-flows", () => ({
  useDataFlows: () => ({ byDataType: state.byDataType }),
}));
vi.mock("../../../hooks/data-hub/use-bridge-sync-states", () => ({
  useBridgeSyncStates: () => new Map(),
}));
vi.mock("../../../hooks/data-hub/use-data-type-source-policies", () => ({
  useDataTypeSourcePolicies: () => state.policies,
}));
vi.mock("../../../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getCapabilities: () => null },
}));
vi.mock("../../../hooks/use-bridge-connections", () => ({
  useBridgeConnections: () => [],
}));
vi.mock("../../../hooks/use-connection-status", () => ({
  useConnectionStatus: () => new Map(),
}));

const route = (bridgeId: string): IntegrationPolicy =>
  ({ bridgeId, enabled: true }) as IntegrationPolicy;

const withImports = (
  entries: Partial<Record<ManagedDataType, string[]>>
): DataFlowsByType =>
  new Map(
    Object.entries(entries).map(([dataType, bridges]) => [
      dataType as ManagedDataType,
      { import: (bridges ?? []).map((b) => route(b)), export: [] },
    ])
  );

const renderTab = () =>
  render(
    <CapabilitiesFixture on={["authority-matrix"]}>
      <AuthorityTab />
    </CapabilitiesFixture>
  );

describe("AuthorityTab", () => {
  beforeEach(() => {
    state.policies = [];
    state.byDataType = new Map();
    state.put = vi.fn();
  });

  it("should say what Kaiord picks for a kind nobody chose, with Automatic pressed", () => {
    // Arrange
    state.byDataType = withImports({
      weight: ["trainingpeaks-bridge", "tanita-bridge"],
    });

    // Act
    renderTab();

    // Assert
    expect(screen.getByTestId("authority-now-weight")).toHaveTextContent(
      "Kaiord picks Tanita for Weight"
    );
    expect(
      screen.getByTestId("authority-choice-weight-automatic")
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("should store a ranked order led by the picked source", () => {
    // Arrange
    state.byDataType = withImports({
      weight: ["trainingpeaks-bridge", "tanita-bridge"],
    });
    renderTab();

    // Act
    fireEvent.click(
      screen.getByTestId("authority-choice-weight-trainingpeaks-bridge")
    );

    // Assert
    expect(state.put).toHaveBeenCalledWith({
      profileId: PROFILE_ID,
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["trainingpeaks-bridge", "tanita-bridge", "manual"],
    });
  });

  it("should hand a chosen kind back to Kaiord with Automatic", () => {
    // Arrange
    state.policies = [
      {
        profileId: PROFILE_ID,
        dataType: "weight",
        mode: "priority",
        sourceOrder: ["trainingpeaks-bridge"],
      },
    ];
    state.byDataType = withImports({
      weight: ["trainingpeaks-bridge", "tanita-bridge"],
    });
    renderTab();

    // Act
    fireEvent.click(screen.getByTestId("authority-choice-weight-automatic"));

    // Assert
    expect(screen.getByTestId("authority-now-weight")).toHaveTextContent(
      "TrainingPeaks decides Weight"
    );
    expect(state.put).toHaveBeenCalledWith({
      profileId: PROFILE_ID,
      dataType: "weight",
      mode: "priority",
      sourceOrder: [
        "manual",
        "fit-import",
        "tanita-bridge",
        "trainingpeaks-bridge",
        "train2go-bridge",
      ],
      automatic: true,
    });
  });

  it("should let a kind chosen for a switched-off source pick one that works", () => {
    // Arrange
    state.policies = [
      {
        profileId: PROFILE_ID,
        dataType: "stress",
        mode: "priority",
        sourceOrder: ["garmin-bridge"],
      },
    ];
    renderTab();

    // Act
    fireEvent.click(screen.getByTestId("authority-choice-stress-manual"));

    // Assert
    expect(screen.getByTestId("authority-now-stress")).toHaveTextContent(
      "Nothing is being read for Stress"
    );
    expect(state.put).toHaveBeenCalledWith({
      profileId: PROFILE_ID,
      dataType: "stress",
      mode: "priority",
      sourceOrder: ["manual"],
    });
  });

  it("should say there is nothing to choose when each kind has one source", () => {
    // Arrange
    state.byDataType = new Map();

    // Act
    renderTab();

    // Assert
    expect(screen.getByTestId("authority-empty")).toBeInTheDocument();
  });
});
