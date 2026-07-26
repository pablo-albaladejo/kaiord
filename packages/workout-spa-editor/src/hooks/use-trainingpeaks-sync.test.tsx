import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { checkTrainingPeaksSession } from "../adapters/trainingpeaks/trainingpeaks-transport";
import { syncTrainingPeaksWeight } from "../application/trainingpeaks/sync-trainingpeaks-weight.use-case";
import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useTrainingPeaksSync } from "./use-trainingpeaks-sync";

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../adapters/trainingpeaks/trainingpeaks-transport", () => ({
  checkTrainingPeaksSession: vi.fn(),
  readTrainingPeaksMetrics: vi.fn(),
}));
vi.mock(
  "../application/trainingpeaks/sync-trainingpeaks-weight.use-case",
  () => ({
    syncTrainingPeaksWeight: vi.fn(),
  })
);
vi.mock("./use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));

// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NO_FIRE_SETTLE_MS = 5 as const;

const mockedGetExtensionId = vi.mocked(bridgeDiscovery.getExtensionId);
const mockedCheckSession = vi.mocked(checkTrainingPeaksSession);
const mockedSync = vi.mocked(syncTrainingPeaksWeight);
const mockedUseDiscoveredBridges = vi.mocked(useDiscoveredBridges);

const TP_DISCOVERED: readonly DiscoveredBridge[] = [
  { bridgeId: "trainingpeaks-bridge", extensionId: "ext-1" },
];

const settle = () => new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

const NO_POLICY = { ok: false, reason: "no-policy" } as const;

describe("useTrainingPeaksSync", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fire the sync once when the bridge is discovered", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockResolvedValue(NO_POLICY);

    // Act
    renderHook(() => useTrainingPeaksSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(1);
    });
    expect(mockedSync.mock.calls[0]?.[1]).toMatchObject({ profileId: "p1" });
  });

  it("should never probe the session itself — the use case owns that ordering", async () => {
    // Arrange
    // The hook injects checkSession as a dep; calling it directly would put a
    // live token exchange ahead of the policy gate.
    mockedUseDiscoveredBridges.mockReturnValue(TP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockResolvedValue(NO_POLICY);
    renderHook(() => useTrainingPeaksSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(1);
    });

    // Assert
    expect(mockedCheckSession).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: "profileId is null",
      bridges: TP_DISCOVERED,
      extensionId: "ext-1",
      profileId: null,
    },
    {
      scenario: "trainingpeaks-bridge is not discovered",
      bridges: [] as DiscoveredBridge[],
      extensionId: "ext-1",
      profileId: "p1",
    },
    {
      scenario: "getExtensionId returns null",
      bridges: TP_DISCOVERED,
      extensionId: null,
      profileId: "p1",
    },
  ])(
    "should not sync when $scenario",
    async ({ bridges, extensionId, profileId }) => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue(bridges);
      mockedGetExtensionId.mockReturnValue(extensionId);
      renderHook(() => useTrainingPeaksSync(profileId), {
        wrapper: ({ children }) => wrap(children),
      });

      // Act
      await settle();

      // Assert
      expect(mockedSync).not.toHaveBeenCalled();
      expect(mockedCheckSession).not.toHaveBeenCalled();
    }
  );

  it("should stay single-shot per profile across re-renders, then fire again for a new profileId", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockResolvedValue(NO_POLICY);
    const { rerender } = renderHook(
      ({ profileId }: { profileId: string | null }) =>
        useTrainingPeaksSync(profileId),
      {
        initialProps: { profileId: "p1" },
        wrapper: ({ children }) => wrap(children),
      }
    );
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(1);
    });

    // Act
    rerender({ profileId: "p1" });
    await settle();

    // Assert
    expect(mockedSync).toHaveBeenCalledTimes(1);
    rerender({ profileId: "p2" });
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(2);
    });
    expect(mockedSync.mock.calls[1]?.[1]).toMatchObject({ profileId: "p2" });
  });

  it("should swallow a rejected sync without an unhandled rejection", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TP_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockRejectedValue(new Error("bridge exploded"));
    renderHook(() => useTrainingPeaksSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(1);
    });
    await settle();

    // Assert
    expect(mockedSync).toHaveBeenCalledTimes(1);
  });
});
