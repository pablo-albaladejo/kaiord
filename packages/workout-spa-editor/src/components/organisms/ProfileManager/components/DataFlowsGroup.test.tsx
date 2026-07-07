import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../../types/integration-policy";

vi.mock("./DataFlowsRow", () => ({
  DataFlowsRow: ({ policy }: { policy: IntegrationPolicy }) => (
    <div data-testid={`row-${policy.id}`} />
  ),
}));

import { DataFlowsGroup } from "./DataFlowsGroup";

const NO_BRIDGES = [] as const;

const makePolicy = (
  id: string,
  direction: "import" | "export"
): IntegrationPolicy => ({
  id,
  profileId: "p1",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction,
  mode: "manual",
  enabled: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("DataFlowsGroup", () => {
  it("should render a Sources subsection only when the data type supports import", async () => {
    // Arrange
    // "planned-session" has only import capability

    // Act
    render(
      <DataFlowsGroup
        dataType="planned-session"
        policies={{ import: [], export: [] }}
        allBridges={NO_BRIDGES}
      />
    );
    // open the group (default collapsed since no policies)
    await userEvent.click(
      screen.getByRole("button", { name: /Planned Session/i })
    );

    // Assert
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.queryByText("Destinations")).not.toBeInTheDocument();
  });

  it("should render a Destinations subsection only when the data type supports export", async () => {
    // Arrange
    // "workout" has both import and export; here we test that Destinations appears

    // Act
    render(
      <DataFlowsGroup
        dataType="workout"
        policies={{ import: [], export: [] }}
        allBridges={NO_BRIDGES}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /Workout/i }));

    // Assert
    expect(screen.getByText("Destinations")).toBeInTheDocument();
  });

  it("should default to collapsed when both subsections are empty", () => {
    // Arrange

    // Act
    render(
      <DataFlowsGroup
        dataType="workout"
        policies={{ import: [], export: [] }}
        allBridges={NO_BRIDGES}
      />
    );

    // Assert
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    expect(screen.queryByText("Destinations")).not.toBeInTheDocument();
  });

  it("should default to expanded when at least one policy exists", () => {
    // Arrange
    const policy = makePolicy("id1", "export");

    // Act
    render(
      <DataFlowsGroup
        dataType="workout"
        policies={{ import: [], export: [policy] }}
        allBridges={NO_BRIDGES}
      />
    );

    // Assert
    expect(screen.getByText("Destinations")).toBeInTheDocument();
  });

  it("should show the per-subsection empty-state copy when zero policies in that direction", () => {
    // Arrange
    const policy = makePolicy("id1", "export");

    // Act
    render(
      <DataFlowsGroup
        dataType="workout"
        policies={{ import: [], export: [policy] }}
        allBridges={NO_BRIDGES}
      />
    );

    // Assert
    expect(screen.getByText("No source configured.")).toBeInTheDocument();
    expect(
      screen.queryByText("No destination configured.")
    ).not.toBeInTheDocument();
  });
});
