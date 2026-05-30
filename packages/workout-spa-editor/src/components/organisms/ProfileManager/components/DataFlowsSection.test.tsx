import type { ManagedDataType } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { UseDataFlowsResult } from "./useDataFlows";

let mockBridges: readonly DiscoveredBridge[] = [];

vi.mock("../../../../hooks/use-discovered-bridges", () => ({
  useDiscoveredBridges: () => mockBridges,
}));

vi.mock("./useDataFlows", () => ({
  useDataFlows: vi.fn(),
}));

vi.mock("./DataFlowsGroup", () => ({
  DataFlowsGroup: ({ dataType }: { dataType: ManagedDataType }) => (
    <div data-testid={`group-${dataType}`} />
  ),
}));

import { DataFlowsSection } from "./DataFlowsSection";
import { useDataFlows } from "./useDataFlows";

const mockUseDataFlows = vi.mocked(useDataFlows);

const TRAIN2GO: DiscoveredBridge = {
  bridgeId: "train2go-bridge",
  extensionId: "ext-1",
};

const emptyResult: UseDataFlowsResult = {
  policies: [],
  byDataType: new Map(),
  hasAny: false,
};

describe("DataFlowsSection", () => {
  beforeEach(() => {
    mockBridges = [];
    mockUseDataFlows.mockReturnValue(emptyResult);
  });

  it("should render the zero-state banner when no bridge is connected", () => {
    // Arrange
    mockBridges = [];

    // Act
    render(<DataFlowsSection profileId="p1" />);

    // Assert
    expect(screen.getByTestId("data-flows-zero-state")).toBeInTheDocument();
    expect(
      screen.getByText("Connect a bridge to start syncing data with kaiord")
    ).toBeInTheDocument();
  });

  it("should render groups when a bridge is connected even with no policies yet", () => {
    // Arrange
    mockBridges = [TRAIN2GO];
    mockUseDataFlows.mockReturnValue(emptyResult);

    // Act
    render(<DataFlowsSection profileId="p1" />);

    // Assert
    expect(
      screen.queryByTestId("data-flows-zero-state")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("group-workout")).toBeInTheDocument();
  });

  it("should render groups when a bridge is connected and policies exist", () => {
    // Arrange
    mockBridges = [TRAIN2GO];
    const byDataType = new Map<ManagedDataType, { import: []; export: [] }>([
      ["workout", { import: [], export: [] }],
    ]);
    mockUseDataFlows.mockReturnValue({
      policies: [
        {
          id: "id1",
          profileId: "p1",
          dataType: "workout",
          bridgeId: "garmin-bridge",
          direction: "export",
          mode: "manual",
          enabled: true,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      byDataType,
      hasAny: true,
    });

    // Act
    render(<DataFlowsSection profileId="p1" />);

    // Assert
    expect(
      screen.queryByTestId("data-flows-zero-state")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("group-workout")).toBeInTheDocument();
  });
});
