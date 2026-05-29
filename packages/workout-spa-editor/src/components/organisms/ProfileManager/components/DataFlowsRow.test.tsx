import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../../types/integration-policy";

const { mockUpsert, mockDelete } = vi.hoisted(() => ({
  mockUpsert: vi.fn(async () => ({}) as IntegrationPolicy),
  mockDelete: vi.fn(async () => undefined),
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
vi.mock(
  "../../../../application/integration-policy/delete-integration-policy.use-case",
  () => ({ deleteIntegrationPolicy: mockDelete })
);

import { DataFlowsRow } from "./DataFlowsRow";

const policy: IntegrationPolicy = {
  id: "pol-1",
  profileId: "p1",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("DataFlowsRow", () => {
  it("should render bridge, mode, and enabled controls reflecting the policy", () => {
    // Arrange

    // Act
    render(<DataFlowsRow policy={policy} allBridges={[]} />);

    // Assert
    expect(screen.getByText(/garmin-bridge/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /mode/i })).toHaveValue(
      "manual"
    );
    expect(screen.getByRole("checkbox", { name: /enabled/i })).toBeChecked();
  });

  it("should call upsertIntegrationPolicy when the mode dropdown changes", async () => {
    // Arrange
    render(<DataFlowsRow policy={policy} allBridges={[]} />);

    // Act
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /mode/i }),
      "auto"
    );

    // Assert
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mode: "auto" })
    );
  });

  it("should call upsertIntegrationPolicy when the enabled checkbox toggles", async () => {
    // Arrange
    render(<DataFlowsRow policy={policy} allBridges={[]} />);

    // Act
    await userEvent.click(screen.getByRole("checkbox", { name: /enabled/i }));

    // Assert
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    );
  });

  it("should call deleteIntegrationPolicy when the remove button is clicked", async () => {
    // Arrange
    render(<DataFlowsRow policy={policy} allBridges={[]} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    // Assert
    expect(mockDelete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "pol-1" })
    );
  });
});
