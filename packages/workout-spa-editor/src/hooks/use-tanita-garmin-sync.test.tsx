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
vi.mock("../adapters/tanita/tanita-transport", () => ({
  readTanitaExportCsv: vi.fn(),
}));
vi.mock("../adapters/garmin/garmin-body-composition-transport", () => ({
  pushGarminBodyComposition: vi.fn(),
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

const BOTH_DISCOVERED: readonly DiscoveredBridge[] = [
  { bridgeId: "tanita-bridge", extensionId: "tanita-ext" },
  { bridgeId: "garmin-bridge", extensionId: "garmin-ext" },
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

  it("should report canSync when both bridges are discovered and a profile is active", () => {
    // Arrange
    discover(BOTH_DISCOVERED);

    // Act
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    expect(result.current.canSync).toBe(true);
  });

  it("should not report canSync when the tanita bridge is missing", () => {
    // Arrange
    discover([{ bridgeId: "garmin-bridge", extensionId: "garmin-ext" }]);

    // Act
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    expect(result.current.canSync).toBe(false);
  });

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

  it("should land on needsReauth when the sync reports a dead session", async () => {
    // Arrange
    discover(BOTH_DISCOVERED);
    mockedSync.mockResolvedValue({ ok: false, reason: "needs-reauth" });
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await act(async () => {
      await result.current.sync();
    });

    // Assert
    expect(result.current.status).toBe("needsReauth");
  });

  it("should land on error and expose lastError for a transport failure", async () => {
    // Arrange
    discover(BOTH_DISCOVERED);
    mockedSync.mockResolvedValue({
      ok: false,
      reason: "transport-error",
      error: "boom",
    });
    const { result } = renderHook(() => useTanitaGarminSync("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await act(async () => {
      await result.current.sync();
    });

    // Assert
    expect(result.current.status).toBe("error");
    expect(result.current.lastError).toBe("boom");
  });

  it("should not run the sync when a bridge is not discovered", async () => {
    // Arrange
    discover([{ bridgeId: "tanita-bridge", extensionId: "tanita-ext" }]);
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
