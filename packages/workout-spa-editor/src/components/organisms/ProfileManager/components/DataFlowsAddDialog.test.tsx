import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../../types/integration-policy";

const { mockUpsert } = vi.hoisted(() => ({
  mockUpsert: vi.fn(async () => ({}) as IntegrationPolicy),
}));

vi.mock("../../../../adapters/dexie/dexie-database", () => ({ db: {} }));
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
  it("should filter the bridge dropdown to bridges advertising the matching capability token", () => {
    // Arrange
    // "planned-session" only has import capability (read:training-plan)
    // garmin-bridge is discovered; train2go-bridge is not

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
    // Both known bridge IDs should appear as options (filtered by capToken existence)
    expect(
      screen.getByRole("option", { name: /garmin-bridge/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /train2go-bridge/ })
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
