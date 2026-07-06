import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { ConnectionFlows } from "./ConnectionFlows";

const EMPTY_FLOWS: DataFlowsByType = new Map();

function renderFlows(capabilities: readonly string[]) {
  render(
    <ConnectionFlows
      bridgeId="garmin-bridge"
      byDataType={EMPTY_FLOWS}
      capabilities={capabilities}
      onToggleFlow={vi.fn()}
      onDisconnect={vi.fn()}
    />
  );
}

describe("ConnectionFlows", () => {
  it("should show only the operational export flow when the bridge only announces write:workouts", () => {
    // Arrange

    // Act
    renderFlows(["write:workouts"]);

    // Assert
    // No aspirational placeholders for capabilities the bridge never
    // announced (F1.0 consensus: honest state over speculative UI).
    expect(
      screen.getByRole("switch", { name: "Export Workout" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Manual (import FIT)")).not.toBeInTheDocument();
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  it("should derive six flows once the bridge announces read:body and read:sleep", () => {
    // Arrange

    // Act
    renderFlows(["read:body", "read:sleep"]);

    // Assert
    // read:body alone covers 5 managed data types by design (N:1 wire
    // token), plus sleep via read:sleep.
    for (const label of [
      "Import Weight",
      "Import HRV",
      "Import Daily Wellness",
      "Import Body Composition",
      "Import Stress",
      "Import Sleep",
    ]) {
      expect(screen.getByRole("switch", { name: label })).toBeInTheDocument();
    }
  });

  it("should render no flows and no toggles when the bridge announces nothing", () => {
    // Arrange

    // Act
    renderFlows([]);

    // Assert
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(screen.getByText("What syncs")).toBeInTheDocument();
  });

  it("should always render the disconnect action", () => {
    // Arrange

    // Act
    renderFlows(["write:workouts"]);

    // Assert
    expect(
      screen.getByRole("button", { name: /disconnect/i })
    ).toBeInTheDocument();
  });
});
