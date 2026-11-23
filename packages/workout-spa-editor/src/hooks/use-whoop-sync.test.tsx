import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { readWhoopUserId } from "../adapters/whoop/connector/whoop-user-transport";
import { syncWhoopActivities } from "../application/whoop/sync-whoop-activities.use-case";
import { syncWhoopCycles } from "../application/whoop/sync-whoop-cycles.use-case";
import { syncWhoopHeartRate } from "../application/whoop/sync-whoop-heart-rate.use-case";
import { syncWhoopStress } from "../application/whoop/sync-whoop-stress.use-case";
import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useWhoopSync } from "./use-whoop-sync";

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../adapters/whoop/connector/whoop-user-transport", () => ({
  readWhoopUserId: vi.fn(),
  readWhoopFetch: vi.fn(),
}));
vi.mock("../application/whoop/sync-whoop-cycles.use-case", () => ({
  syncWhoopCycles: vi.fn(),
}));
vi.mock("../application/whoop/sync-whoop-heart-rate.use-case", () => ({
  syncWhoopHeartRate: vi.fn(),
}));
vi.mock("../application/whoop/sync-whoop-activities.use-case", () => ({
  syncWhoopActivities: vi.fn(),
}));
vi.mock("../application/whoop/sync-whoop-stress.use-case", () => ({
  syncWhoopStress: vi.fn(),
}));
vi.mock("./use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));

// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NO_FIRE_SETTLE_MS = 5 as const;

const mockedGetExtensionId = vi.mocked(bridgeDiscovery.getExtensionId);
const mockedReadUserId = vi.mocked(readWhoopUserId);
const mockedSyncCycles = vi.mocked(syncWhoopCycles);
const mockedSyncHeartRate = vi.mocked(syncWhoopHeartRate);
const mockedSyncActivities = vi.mocked(syncWhoopActivities);
const mockedSyncStress = vi.mocked(syncWhoopStress);
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

const WHOOP_USER_ID = 42;

describe("useWhoopSync", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fire all four syncs once when the bridge is discovered and a session is captured", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadUserId.mockResolvedValue(WHOOP_USER_ID);
    mockedSyncCycles.mockResolvedValue({ ok: false, reason: "no-policy" });
    mockedSyncHeartRate.mockResolvedValue({ ok: false, reason: "no-policy" });
    mockedSyncActivities.mockResolvedValue({
      ok: false,
      reason: "route-inactive",
    });
    mockedSyncStress.mockResolvedValue({ ok: false, reason: "no-policy" });

    // Act
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(mockedSyncCycles).toHaveBeenCalledTimes(1);
      expect(mockedSyncHeartRate).toHaveBeenCalledTimes(1);
      expect(mockedSyncActivities).toHaveBeenCalledTimes(1);
      expect(mockedSyncStress).toHaveBeenCalledTimes(1);
    });
    expect(mockedSyncCycles.mock.calls[0]?.[1]).toMatchObject({
      profileId: "p1",
      userId: 42,
    });
    expect(mockedSyncHeartRate.mock.calls[0]?.[1]).toMatchObject({
      profileId: "p1",
      userId: 42,
    });
    expect(mockedSyncActivities.mock.calls[0]?.[1]).toMatchObject({
      profileId: "p1",
      userId: 42,
    });
    expect(mockedSyncStress.mock.calls[0]?.[1]).toMatchObject({
      profileId: "p1",
      userId: 42,
    });
  });

  it.each([
    {
      scenario: "profileId is null",
      bridges: WHOOP_DISCOVERED,
      extensionId: "ext-1",
      profileId: null,
    },
    {
      scenario: "whoop-bridge is not discovered",
      bridges: [] as DiscoveredBridge[],
      extensionId: "ext-1",
      profileId: "p1",
    },
    {
      scenario: "getExtensionId returns null",
      bridges: WHOOP_DISCOVERED,
      extensionId: null,
      profileId: "p1",
    },
  ])(
    "should not read the WHOOP id when $scenario",
    async ({ bridges, extensionId, profileId }) => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue(bridges);
      mockedGetExtensionId.mockReturnValue(extensionId);
      mockedReadUserId.mockResolvedValue(WHOOP_USER_ID);
      renderHook(() => useWhoopSync(profileId), {
        wrapper: ({ children }) => wrap(children),
      });

      // Act
      await settle();

      // Assert
      expect(mockedReadUserId).not.toHaveBeenCalled();
    }
  );

  it("should not sync when the extension holds no captured session", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadUserId.mockResolvedValue(null);
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedReadUserId).toHaveBeenCalledTimes(1);
    });
    await settle();

    // Assert
    expect(mockedSyncCycles).not.toHaveBeenCalled();
    expect(mockedSyncHeartRate).not.toHaveBeenCalled();
    expect(mockedSyncActivities).not.toHaveBeenCalled();
    expect(mockedSyncStress).not.toHaveBeenCalled();
  });

  it("should stay single-shot per profile across re-renders, then fire again for a new profileId", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadUserId.mockResolvedValue(WHOOP_USER_ID);
    mockedSyncCycles.mockResolvedValue({ ok: false, reason: "no-policy" });
    mockedSyncHeartRate.mockResolvedValue({ ok: false, reason: "no-policy" });
    mockedSyncActivities.mockResolvedValue({
      ok: false,
      reason: "route-inactive",
    });
    mockedSyncStress.mockResolvedValue({ ok: false, reason: "no-policy" });
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

  it("should swallow a thrown WHOOP id read without an unhandled rejection", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(WHOOP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedReadUserId.mockRejectedValue(new Error("no session token"));
    renderHook(() => useWhoopSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedReadUserId).toHaveBeenCalledTimes(1);
    });
    await settle();

    // Assert
    expect(mockedSyncCycles).not.toHaveBeenCalled();
    expect(mockedSyncHeartRate).not.toHaveBeenCalled();
    expect(mockedSyncActivities).not.toHaveBeenCalled();
    expect(mockedSyncStress).not.toHaveBeenCalled();
  });
});
