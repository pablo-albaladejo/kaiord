import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { IntegrationPolicy } from "../types/integration-policy";
import { useConnectionActions } from "./use-connection-actions";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000b2";

const state = vi.hoisted(() => ({
  connect: vi.fn(async () => undefined),
  logError: vi.fn(),
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
vi.mock("../utils/logger", () => ({
  logger: { error: state.logError },
}));

const setup = () => {
  const persistence = createInMemoryPersistence();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  const { result } = renderHook(() => useConnectionActions(PROFILE_ID), {
    wrapper,
  });
  const rows = async (dataType: IntegrationPolicy["dataType"]) =>
    persistence.integrationPolicy.findByProfileDirection({
      profileId: PROFILE_ID,
      dataType,
      direction: "import",
    });
  return { persistence, actions: result.current, rows };
};

describe("useConnectionActions connect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should open the activity import route when Garmin reconnects without one", async () => {
    // Arrange
    const { actions, rows } = setup();

    // Act
    await actions.connect("garmin", "bridge");

    // Assert
    expect(state.connect).toHaveBeenCalledOnce();
    expect(await rows("activity")).toMatchObject([
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
    const { persistence, actions, rows } = setup();
    const off: IntegrationPolicy = {
      id: "00000000-0000-4000-8000-0000000000c1",
      profileId: PROFILE_ID,
      dataType: "activity",
      direction: "import",
      bridgeId: "garmin-bridge",
      mode: "auto",
      enabled: false,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    await persistence.integrationPolicy.put(off);

    // Act
    await actions.connect("garmin", "bridge");

    // Assert
    expect(await rows("activity")).toEqual([off]);
  });

  it("should open no route for a source without a bridge", async () => {
    // Arrange
    const { actions, rows } = setup();

    // Act
    await actions.connect("manual", "manual");

    // Assert
    expect(await rows("activity")).toEqual([]);
  });

  it("should log a failed route seed instead of rejecting the reconnect", async () => {
    // Arrange
    const { persistence, actions } = setup();
    vi.spyOn(persistence.integrationPolicy, "put").mockRejectedValue(
      new Error("quota")
    );

    // Act
    const outcome = actions.connect("garmin", "bridge");

    // Assert
    await expect(outcome).resolves.toBeUndefined();
    expect(state.logError).toHaveBeenCalledExactlyOnceWith(expect.any(String));
  });
});
