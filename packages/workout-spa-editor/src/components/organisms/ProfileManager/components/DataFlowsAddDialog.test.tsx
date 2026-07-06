import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../../types/integration-policy";

const { mockUpsert, mockGetCapabilities } = vi.hoisted(() => ({
  mockUpsert: vi.fn(async () => ({}) as IntegrationPolicy),
  mockGetCapabilities: vi.fn((): readonly string[] | null => null),
}));

vi.mock("../../../../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../../../../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getCapabilities: mockGetCapabilities },
}));
vi.mock(
  "../../../../adapters/dexie/dexie-integration-policy-repository",
  () => ({
    createDexieIntegrationPolicyRepository: () => ({
      findByNaturalKey: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
      findByProfileDirection: vi.fn(async () => []),
    }),
  })
);
vi.mock(
  "../../../../application/integration-policy/upsert-integration-policy.use-case",
  () => ({ upsertIntegrationPolicy: mockUpsert })
);

import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import { DataFlowsAddDialog } from "./DataFlowsAddDialog";

const garminDiscovered: DiscoveredBridge = {
  bridgeId: "garmin-bridge",
  extensionId: "ext-001",
};

describe("DataFlowsAddDialog", () => {
  it("should only offer bridges that actually announce the matching capability token", () => {
    // Arrange
    // "planned-session" import requires read:training-plan — only
    // train2go-bridge announces it; garmin-bridge announces write:workouts.
    mockGetCapabilities.mockImplementation((bridgeId) => {
      if (bridgeId === "train2go-bridge") return ["read:training-plan"];
      if (bridgeId === "garmin-bridge") return ["write:workouts"];
      return null;
    });

    // Act
    render(
      <DataFlowsAddDialog
        profileId="p1"
        dataType="planned-session"
        direction="import"
        discoveredBridges={[garminDiscovered]}
        onClose={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByRole("option", { name: /train2go-bridge/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /garmin-bridge/ })
    ).not.toBeInTheDocument();
  });

  it("should offer whoop-bridge for an hrv import once it announces read:body (previously missing from KNOWN_BRIDGE_IDS)", () => {
    // Arrange
    mockGetCapabilities.mockImplementation((bridgeId) =>
      bridgeId === "whoop-bridge" ? ["read:body", "read:sleep"] : null
    );
    const whoopDiscovered: DiscoveredBridge = {
      bridgeId: "whoop-bridge",
      extensionId: "ext-002",
    };

    // Act
    render(
      <DataFlowsAddDialog
        profileId="p1"
        dataType="hrv"
        direction="import"
        discoveredBridges={[whoopDiscovered]}
        onClose={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByRole("option", { name: /whoop-bridge/ })
    ).toBeInTheDocument();
  });

  it("should disable the add button when the selected bridge is not currently discovered", async () => {
    // Arrange
    // No bridges discovered

    // Act
    render(
      <DataFlowsAddDialog
        profileId="p1"
        dataType="workout"
        direction="export"
        discoveredBridges={[]}
        onClose={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByRole("button", { name: /Add/i })).toBeDisabled();
  });

  it("should call upsertIntegrationPolicy with the chosen bridge, mode, and enabled state", async () => {
    // Arrange
    mockGetCapabilities.mockImplementation((bridgeId) =>
      bridgeId === "garmin-bridge" ? ["write:workouts"] : null
    );
    const onClose = vi.fn();
    render(
      <DataFlowsAddDialog
        profileId="p1"
        dataType="workout"
        direction="export"
        discoveredBridges={[garminDiscovered]}
        onClose={onClose}
      />
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: /Add/i }));

    // Assert
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        profileId: "p1",
        dataType: "workout",
        direction: "export",
        bridgeId: "garmin-bridge",
        mode: "manual",
        enabled: true,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
