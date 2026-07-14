import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { readWhoopStatus } from "../adapters/bridge/whoop-transport";
import { syncWhoopCycles } from "../application/whoop/sync-whoop-cycles.use-case";
import { syncWhoopHeartRate } from "../application/whoop/sync-whoop-heart-rate.use-case";
import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useWhoopSync } from "./use-whoop-sync";

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../adapters/bridge/whoop-transport", () => ({
  readWhoopStatus: vi.fn(),
  readWhoopFetch: vi.fn(),
}));
vi.mock("../application/whoop/sync-whoop-cycles.use-case", () => ({
  syncWhoopCycles: vi.fn(),
}));
vi.mock("../application/whoop/sync-whoop-heart-rate.use-case", () => ({
  syncWhoopHeartRate: vi.fn(),
}));
vi.mock("./use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));

// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NO_FIRE_SETTLE_MS = 5 as const;

const mockedGetExtensionId = vi.mocked(bridgeDiscovery.getExtensionId);
const mockedReadStatus = vi.mocked(readWhoopStatus);
const mockedSyncCycles = vi.mocked(syncWhoopCycles);
const mockedSyncHeartRate = vi.mocked(syncWhoopHeartRate);
const mockedUseDiscoveredBridges = vi.mocked(useDiscoveredBridges);

const WHOOP_DISCOVERED: readonly DiscoveredBridge[] = [
  { bridgeId: "whoop-bridge", extensionId: "ext-1" },
];

const settle = () => new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

// Epoch-millis, matching the extension's `whoopCapturedAt: Date.now()`.
const CAPTURED_AT_MS = 1_720_000_000_000;

const connectedStatus = {
  connected: true,
  userId: 42,
  capturedAt: CAPTURED_AT_MS,
};

describe("useWhoopSync", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fire both syncs once when the bridge is discovered and a session is captured", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadStatus.mockResolvedValue(connectedStatus);
    mockedSyncCycles.mockResolvedValue({ ok: false, reason: "no-policy" });
    mockedSyncHeartRate.mockResolvedValue({ ok: false, reason: "no-policy" });

    // Act
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(mockedSyncCycles).toHaveBeenCalledTimes(1);
      expect(mockedSyncHeartRate).toHaveBeenCalledTimes(1);
    });
    expect(mockedSyncCycles.mock.calls[0]?.[1]).toMatchObject({
      profileId: "p1",
      userId: 42,
    });
    expect(mockedSyncHeartRate.mock.calls[0]?.[1]).toMatchObject({
      profileId: "p1",
      userId: 42,
    });
  });

  it("should do NOT fire when profileId is null", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadStatus.mockResolvedValue(connectedStatus);
    renderHook(() => useWhoopSync(null), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await settle();

    // Assert
    expect(mockedReadStatus).not.toHaveBeenCalled();
  });

  it("should do NOT fire when whoop-bridge is not discovered", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue([]);
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await settle();

    // Assert
    expect(mockedReadStatus).not.toHaveBeenCalled();
  });

  it("should do NOT fire when getExtensionId returns null", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue(null);
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await settle();

    // Assert
    expect(mockedReadStatus).not.toHaveBeenCalled();
  });

  it("should do NOT sync when status.connected is false", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadStatus.mockResolvedValue({
      connected: false,
      userId: 42,
      capturedAt: null,
    });
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedReadStatus).toHaveBeenCalledTimes(1);
    });
    await settle();

    // Assert
    expect(mockedSyncCycles).not.toHaveBeenCalled();
    expect(mockedSyncHeartRate).not.toHaveBeenCalled();
  });

  it("should do NOT sync when status.userId is null", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadStatus.mockResolvedValue({
      connected: true,
      userId: null,
      capturedAt: null,
    });
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedReadStatus).toHaveBeenCalledTimes(1);
    });
    await settle();

    // Assert
    expect(mockedSyncCycles).not.toHaveBeenCalled();
    expect(mockedSyncHeartRate).not.toHaveBeenCalled();
  });

  it("should stay single-shot per profile across re-renders, then fire again for a new profileId", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadStatus.mockResolvedValue(connectedStatus);
    mockedSyncCycles.mockResolvedValue({ ok: false, reason: "no-policy" });
    mockedSyncHeartRate.mockResolvedValue({ ok: false, reason: "no-policy" });
    const { rerender } = renderHook(
      ({ profileId }: { profileId: string | null }) => useWhoopSync(profileId),
      {
        initialProps: { profileId: "p1" },
        wrapper: ({ children }) => wrap(children),
      }
    );
    await waitFor(() => {
      expect(mockedSyncCycles).toHaveBeenCalledTimes(1);
    });

    // Act
    rerender({ profileId: "p1" });
    await settle();

    // Assert
    expect(mockedSyncCycles).toHaveBeenCalledTimes(1);
    rerender({ profileId: "p2" });
    await waitFor(() => {
      expect(mockedSyncCycles).toHaveBeenCalledTimes(2);
    });
    expect(mockedSyncCycles.mock.calls[1]?.[1]).toMatchObject({
      profileId: "p2",
    });
  });

  it("should swallow a thrown readWhoopStatus without an unhandled rejection", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadStatus.mockRejectedValue(new Error("no session token"));
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedReadStatus).toHaveBeenCalledTimes(1);
    });
    await settle();

    // Assert
    expect(mockedSyncCycles).not.toHaveBeenCalled();
    expect(mockedSyncHeartRate).not.toHaveBeenCalled();
  });
});
