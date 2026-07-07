import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { DataHubRow } from "../../../application/data-hub/build-data-hub-matrix";
import type { IntegrationRegistryEntry } from "../../../integrations/integration-registry";
import type { ConnectionRecord } from "../../../types/connection";
import { DataHubMatrix } from "./DataHubMatrix";

const NOW = "2026-05-01T00:00:00.000Z";

const INTEGRATIONS: IntegrationRegistryEntry[] = [
  { id: "garmin", name: "Garmin", mark: "G", mechanism: "bridge", bridgeId: "garmin-bridge" },
  { id: "strava", name: "Strava", mark: "S", mechanism: "not-supported", bridgeId: null },
  { id: "manual", name: "Manual", mark: "M", mechanism: "manual", bridgeId: null },
];

const ROWS: DataHubRow[] = [
  {
    dataType: "workout",
    label: "Workout",
    cells: [
      { integrationId: "garmin", direction: "export", state: "active", enabled: true, lastSyncedAt: NOW },
      { integrationId: "garmin", direction: "import", state: "na", enabled: false },
      { integrationId: "strava", direction: "export", state: "aspirational", enabled: false },
      { integrationId: "manual", direction: "import", state: "manual", enabled: false },
    ],
  },
];

const connections = (): ReadonlyMap<string, ConnectionRecord> =>
  new Map([
    [
      "garmin",
      { profileId: "p", providerId: "garmin", status: "connected", mechanism: "bridge", updatedAt: NOW },
    ],
  ]);

describe("DataHubMatrix", () => {
  it("should render a labelled row and a header per integration", () => {
    // Arrange

    // Act
    render(
      <DataHubMatrix
        rows={ROWS}
        integrations={INTEGRATIONS}
        connections={connections()}
        onToggle={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId("data-hub-row-workout")).toBeInTheDocument();
    expect(screen.getByText("Workout")).toBeInTheDocument();
    expect(screen.getByTestId("data-hub-col-garmin")).toBeInTheDocument();
    expect(screen.getByTestId("data-hub-col-strava")).toBeInTheDocument();
  });

  it("should render an active cell as a toggle button that fires onToggle", async () => {
    // Arrange
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <DataHubMatrix
        rows={ROWS}
        integrations={INTEGRATIONS}
        connections={connections()}
        onToggle={onToggle}
      />
    );

    // Act
    const cell = screen.getByTestId("data-hub-cell-workout-garmin-export");
    await user.click(cell);

    // Assert
    expect(cell.tagName).toBe("BUTTON");
    expect(cell).toHaveAttribute("data-state", "active");
    expect(onToggle).toHaveBeenCalledWith(
      "workout",
      "garmin-bridge",
      expect.objectContaining({ direction: "export", state: "active" })
    );
  });

  it("should not render a cell for an n/a state", () => {
    // Arrange

    // Act
    render(
      <DataHubMatrix
        rows={ROWS}
        integrations={INTEGRATIONS}
        connections={connections()}
        onToggle={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.queryByTestId("data-hub-cell-workout-garmin-import")
    ).not.toBeInTheDocument();
  });

  it("should render a not-supported cell as a non-interactive span", () => {
    // Arrange

    // Act
    render(
      <DataHubMatrix
        rows={ROWS}
        integrations={INTEGRATIONS}
        connections={connections()}
        onToggle={vi.fn()}
      />
    );

    // Assert
    const cell = screen.getByTestId("data-hub-cell-workout-strava-export");
    expect(cell.tagName).toBe("SPAN");
    expect(cell).toHaveAttribute("data-state", "aspirational");
  });

  it("should surface each integration connection state in the header", () => {
    // Arrange

    // Act
    render(
      <DataHubMatrix
        rows={ROWS}
        integrations={INTEGRATIONS}
        connections={connections()}
        onToggle={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId("data-hub-conn-garmin")).toHaveAttribute(
      "data-connected",
      "true"
    );
    expect(screen.getByTestId("data-hub-conn-strava")).toHaveTextContent("—");
  });
});
