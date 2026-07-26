import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeConnections } from "../adapters/bridge/bridge-connection-store";
import type { BridgeConnectionRuntime } from "../adapters/bridge/bridge-connection-types";
import { PersistenceProvider } from "../contexts/persistence-context";
import type { PersistencePort } from "../ports/persistence-port";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { useBridgeConnections } from "./use-bridge-connections";

vi.mock("../adapters/bridge/bridge-connection-store", () => ({
  bridgeConnections: { subscribe: vi.fn(() => () => {}), getSnapshot: vi.fn() },
}));

const mockedGetSnapshot = vi.mocked(bridgeConnections.getSnapshot);

const LAST_CHECKED_AT = 1_700_000_000_000;

const runtimeEntry = (
  bridgeId: string,
  overrides: Partial<BridgeConnectionRuntime> = {}
): BridgeConnectionRuntime => ({
  bridgeId,
  discovered: true,
  sessionActive: true,
  checking: false,
  error: null,
  needsReauth: false,
  lastCheckedAt: LAST_CHECKED_AT,
  ...overrides,
});

const wrap = (persistence: PersistencePort) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return Wrapper;
};

describe("useBridgeConnections", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should expose the runtime snapshot with an undefined lastSyncAt by default", async () => {
    // Arrange
    const snapshot = [runtimeEntry("garmin-bridge")];
    mockedGetSnapshot.mockReturnValue(snapshot);
    const persistence = createInMemoryPersistence();

    // Act
    const { result } = renderHook(() => useBridgeConnections("p1"), {
      wrapper: wrap(persistence),
    });

    // Assert
    await waitFor(() => {
      expect(result.current).toEqual([
        { ...snapshot[0], lastSyncAt: undefined },
      ]);
    });
  });

  it("should merge the persisted lastSyncedAt for each bridge", async () => {
    // Arrange
    const snapshot = [
      runtimeEntry("garmin-bridge"),
      runtimeEntry("train2go-bridge"),
    ];
    mockedGetSnapshot.mockReturnValue(snapshot);
    const persistence = createInMemoryPersistence();
    await persistence.coachingSyncState.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-07-25T10:00:00.000Z",
    });

    // Act
    const { result } = renderHook(() => useBridgeConnections("p1"), {
      wrapper: wrap(persistence),
    });

    // Assert
    await waitFor(() => {
      expect(
        result.current.find((r) => r.bridgeId === "train2go-bridge")?.lastSyncAt
      ).toBe("2026-07-25T10:00:00.000Z");
    });
    expect(
      result.current.find((r) => r.bridgeId === "garmin-bridge")?.lastSyncAt
    ).toBeUndefined();
  });

  it("should not read sync rows without an active profile", async () => {
    // Arrange
    mockedGetSnapshot.mockReturnValue([runtimeEntry("garmin-bridge")]);
    const persistence = createInMemoryPersistence();
    const spy = vi.spyOn(
      persistence.coachingSyncState,
      "getBySourceAndProfile"
    );

    // Act
    const { result } = renderHook(() => useBridgeConnections(null), {
      wrapper: wrap(persistence),
    });

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should subscribe to the connection store", () => {
    // Arrange
    mockedGetSnapshot.mockReturnValue([]);
    const persistence = createInMemoryPersistence();

    // Act
    renderHook(() => useBridgeConnections("p1"), {
      wrapper: wrap(persistence),
    });

    // Assert
    expect(bridgeConnections.subscribe).toHaveBeenCalled();
  });
});
