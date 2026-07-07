import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { buildDataRouteSignals } from "./build-data-route-signals";

const getExtensionId = vi.fn();
const getCapabilities = vi.fn();

vi.mock("../../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: {
    getExtensionId: (id: string) => getExtensionId(id),
    getCapabilities: (id: string) => getCapabilities(id),
  },
}));

const PROFILE_ID = "p1";

describe("buildDataRouteSignals", () => {
  it("should read bridge online/announces state from bridge discovery", async () => {
    // Arrange
    getExtensionId.mockImplementation((id: string) =>
      id === "train2go-bridge" ? "ext-1" : null
    );
    getCapabilities.mockImplementation((id: string) =>
      id === "train2go-bridge" ? ["read:training-plan"] : null
    );
    const persistence = createInMemoryPersistence();

    // Act
    const signals = await buildDataRouteSignals(persistence, PROFILE_ID);

    // Assert
    expect(signals.isBridgeOnline("train2go-bridge")).toBe(true);
    expect(signals.isBridgeOnline("garmin-bridge")).toBe(false);
    expect(
      signals.bridgeAnnounces("train2go-bridge", "read:training-plan")
    ).toBe(true);
    expect(signals.bridgeAnnounces("train2go-bridge", "read:activities")).toBe(
      false
    );
  });

  it("should read enabled routes and freshness from persisted IntegrationPolicy rows", async () => {
    // Arrange
    getExtensionId.mockReturnValue(null);
    getCapabilities.mockReturnValue(null);
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put({
      id: "route-1",
      profileId: PROFILE_ID,
      dataType: "planned-session",
      bridgeId: "train2go-bridge",
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    await persistence.coachingSyncState.put({
      source: "train2go",
      profileId: PROFILE_ID,
      lastSyncedAt: "2026-07-06T08:00:00.000Z",
    });

    // Act
    const signals = await buildDataRouteSignals(persistence, PROFILE_ID);

    // Assert
    expect(
      signals.isRouteEnabled("planned-session", "import", "train2go-bridge")
    ).toBe(true);
    expect(
      signals.findRoute("planned-session", "import", "train2go-bridge")
    ).toEqual({ id: "route-1", mode: "auto" });
    expect(signals.lastSyncedAt("train2go")).toBe("2026-07-06T08:00:00.000Z");
    expect(signals.lastSyncedAt("garmin")).toBeUndefined();
  });

  it("should read connection status from the connections store", async () => {
    // Arrange
    getExtensionId.mockReturnValue(null);
    getCapabilities.mockReturnValue(null);
    const persistence = createInMemoryPersistence();
    await persistence.connections.put({
      profileId: PROFILE_ID,
      providerId: "intervals",
      status: "connected",
      connectedAt: "2026-07-01T00:00:00.000Z",
    } as never);

    // Act
    const signals = await buildDataRouteSignals(persistence, PROFILE_ID);

    // Assert
    expect(signals.isConnected("intervals")).toBe(true);
    expect(signals.isConnected("strava")).toBe(false);
  });
});
