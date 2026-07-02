import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { CONNECTIONS } from "./connection-config";
import { ConnectionFlows } from "./ConnectionFlows";

const garmin = CONNECTIONS.find((connection) => connection.id === "garmin");
if (!garmin) throw new Error("garmin fixture missing from CONNECTIONS");

const EMPTY_FLOWS: DataFlowsByType = new Map();

function renderFlows(capabilities: readonly string[]) {
  render(
    <ConnectionFlows
      config={garmin}
      bridgeId="garmin-bridge"
      byDataType={EMPTY_FLOWS}
      capabilities={capabilities}
      onToggleFlow={vi.fn()}
      onDisconnect={vi.fn()}
    />
  );
}

describe("ConnectionFlows", () => {
  it("should show both import flows as manual when the bridge only announces write:workouts", () => {
    // Arrange

    // Act
    renderFlows(["write:workouts"]);

    // Assert
    expect(screen.getAllByText("Manual (import FIT)")).toHaveLength(2);
  });

  it("should keep the export flow operative when the bridge announces write:workouts", () => {
    // Arrange

    // Act
    renderFlows(["write:workouts"]);

    // Assert
    expect(
      screen.getByRole("switch", { name: "Planned workouts" })
    ).toBeInTheDocument();
  });

  it("should make the readiness import flow operative once the bridge announces read:body", () => {
    // Arrange

    // Act
    renderFlows(["write:workouts", "read:body", "read:sleep"]);

    // Assert
    expect(
      screen.getByRole("switch", { name: "Daily readiness (HRV, sleep)" })
    ).toBeInTheDocument();
  });

  it("should keep completed-activities import manual without read:workouts", () => {
    // Arrange

    // Act
    renderFlows(["write:workouts", "read:body", "read:sleep"]);

    // Assert
    expect(screen.getByText("Manual (import FIT)")).toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: "Completed activities" })
    ).toBeNull();
  });
});
