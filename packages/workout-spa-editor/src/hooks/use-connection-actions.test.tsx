import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../types/integration-policy";
import { useConnectionActions } from "./use-connection-actions";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000b2";

const state = vi.hoisted(() => ({
  rows: [] as IntegrationPolicy[],
  connect: vi.fn(async () => undefined),
}));

vi.mock("../adapters/connections/create-connection-provider", () => ({
  createConnectionProvider: () => ({ connect: state.connect }),
}));
vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: {
    getCapabilities: (id: string) =>
      id === "garmin-bridge"
        ? ["write:workouts", "read:activities", "write:body"]
        : null,
  },
}));
vi.mock("./integration-policy-repo", () => ({
  policyRepo: {
    findByNaturalKey: async (key: Omit<IntegrationPolicy, "id">) =>
      state.rows.find(
        (r) =>
          r.profileId === key.profileId &&
          r.dataType === key.dataType &&
          r.direction === key.direction &&
          r.bridgeId === key.bridgeId
      ),
    put: async (row: IntegrationPolicy) => {
      state.rows = [...state.rows.filter((r) => r.id !== row.id), row];
    },
  },
}));

describe("useConnectionActions connect", () => {
  beforeEach(() => {
    state.rows = [];
    vi.clearAllMocks();
  });

  it("should open the activity import route when Garmin reconnects without one", async () => {
    // Arrange
    const { result } = renderHook(() => useConnectionActions(PROFILE_ID));

    // Act
    await result.current.connect("garmin", "bridge");

    // Assert
    expect(state.connect).toHaveBeenCalledOnce();
    expect(state.rows).toMatchObject([
      {
        dataType: "activity",
        direction: "import",
        bridgeId: "garmin-bridge",
        mode: "auto",
        enabled: true,
      },
    ]);
  });

  it("should leave an activity import route the user switched off disabled", async () => {
    // Arrange
    const off: IntegrationPolicy = {
      id: "off",
      profileId: PROFILE_ID,
      dataType: "activity",
      direction: "import",
      bridgeId: "garmin-bridge",
      mode: "auto",
      enabled: false,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    state.rows = [off];
    const { result } = renderHook(() => useConnectionActions(PROFILE_ID));

    // Act
    await result.current.connect("garmin", "bridge");

    // Assert
    expect(state.rows).toEqual([off]);
  });

  it("should open no route for a source without a bridge", async () => {
    // Arrange
    const { result } = renderHook(() => useConnectionActions(PROFILE_ID));

    // Act
    await result.current.connect("manual", "manual");

    // Assert
    expect(state.rows).toEqual([]);
  });
});
