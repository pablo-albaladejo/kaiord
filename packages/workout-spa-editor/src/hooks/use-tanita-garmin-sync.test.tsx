import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { syncTanitaBodyComposition } from "../application/health/sync-tanita-body-composition.use-case";
import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useTanitaGarminSync } from "./use-tanita-garmin-sync";

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../application/health/sync-tanita-body-composition.use-case", () => ({
  syncTanitaBodyComposition: vi.fn(),
}));
vi.mock("./garmin-push-fn", () => ({ ledgerRepo: {} }));
vi.mock("./use-discovered-bridges", () => ({ useDiscoveredBridges: vi.fn() }));
vi.mock("@kaiord/tanita", () => ({ tanitaCsvToKrd: vi.fn() }));
vi.mock("@kaiord/fit", () => ({ encodeBodyCompositionFit: vi.fn() }));

const mockedGetExtensionId = vi.mocked(bridgeDiscovery.getExtensionId);
const mockedSync = vi.mocked(syncTanitaBodyComposition);
const mockedUseDiscoveredBridges = vi.mocked(useDiscoveredBridges);

type SyncResult = Awaited<ReturnType<typeof syncTanitaBodyComposition>>;

const BOTH_DISCOVERED: readonly DiscoveredBridge[] = [
  { bridgeId: "tanita-bridge", extensionId: "tanita-ext" },
  { bridgeId: "garmin-bridge", extensionId: "garmin-ext" },
];
const GARMIN_ONLY: readonly DiscoveredBridge[] = [
  { bridgeId: "garmin-bridge", extensionId: "garmin-ext" },
];
const TANITA_ONLY: readonly DiscoveredBridge[] = [
  { bridgeId: "tanita-bridge", extensionId: "tanita-ext" },
];

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

const discover = (bridges: readonly DiscoveredBridge[]) => {
  mockedUseDiscoveredBridges.mockReturnValue(bridges);
  mockedGetExtensionId.mockImplementation((bridgeId) => {
    const found = bridges.find((b) => b.bridgeId === bridgeId);
    return found ? found.extensionId : null;
  });
};

describe("useTanitaGarminSync", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    {
      scenario: "both bridges are discovered and a profile is active",
      bridges: BOTH_DISCOVERED,
      expected: true,
    },
    {
      scenario: "the tanita bridge is missing",
      bridges: GARMIN_ONLY,
      expected: false,
    },
  ])(
    "should report canSync $expected when $scenario",
    ({ bridges, expected }) => {
      // Arrange
      discover(bridges);

      // Act
      const { result } = renderHook(() => useTanitaGarminSync("p1"), {
        wrapper: ({ children }) => wrap(children),
      });

      // Assert
      expect(result.current.canSync).toBe(expected);
    }
  );

  it("should run the governed sync and land on done for a successful result", async () => {
    // Arrange
    discover(BOTH_DISCOVERED);
    mockedSync.mockResolvedValue({ ok: true, uploaded: 2, skipped: 0 });
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await act(async () => {
      await result.current.sync();
    });

    // Assert
    expect(mockedSync.mock.calls[0]?.[1]).toEqual({ profileId: "p1" });
    expect(result.current.status).toBe("done");
  });

  it.each([
    {
      scenario: "a dead session",
      syncResult: { ok: false, reason: "needs-reauth" } as SyncResult,
      status: "needsReauth",
      lastError: null,
    },
    {
      scenario: "a transport failure",
      syncResult: {
        ok: false,
        reason: "transport-error",
        error: "boom",
      } as SyncResult,
      status: "error",
      lastError: "boom",
    },
  ])(
    "should land on $status and expose lastError $lastError for $scenario",
    async ({ syncResult, status, lastError }) => {
      // Arrange
      discover(BOTH_DISCOVERED);
      mockedSync.mockResolvedValue(syncResult);
      const { result } = renderHook(() => useTanitaGarminSync("p1"), {
        wrapper: ({ children }) => wrap(children),
      });

      // Act
      await act(async () => {
        await result.current.sync();
      });

      // Assert
      expect(result.current.status).toBe(status);
      expect(result.current.lastError).toBe(lastError);
    }
  );

  it("should not run the sync when a bridge is not discovered", async () => {
    // Arrange
    discover(TANITA_ONLY);
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await act(async () => {
      await result.current.sync();
    });

    // Assert
    expect(mockedSync).not.toHaveBeenCalled();
  });

  it("should reflect the use case phase callback in the exposed status", async () => {
    // Arrange
    discover(BOTH_DISCOVERED);
    let resolveSync: (r: {
      ok: true;
      uploaded: number;
      skipped: number;
    }) => void;
    mockedSync.mockImplementation(async (deps) => {
      deps.onPhase?.("uploading");
      return new Promise((res) => {
        resolveSync = res;
      });
    });
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    let pending: Promise<void>;
    act(() => {
      pending = result.current.sync();
    });
    await waitFor(() => expect(result.current.status).toBe("uploading"));
    await act(async () => {
      resolveSync({ ok: true, uploaded: 1, skipped: 0 });
      await pending;
    });

    // Assert
    expect(result.current.status).toBe("done");
  });
});
