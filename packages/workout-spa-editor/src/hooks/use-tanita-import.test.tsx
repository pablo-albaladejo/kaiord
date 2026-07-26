import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { readTanitaExportCsv } from "../adapters/tanita/tanita-transport";
import { syncTanitaImport } from "../application/tanita/sync-tanita-import.use-case";
import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useTanitaImport } from "./use-tanita-import";

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../adapters/tanita/tanita-transport", () => ({
  readTanitaExportCsv: vi.fn(),
}));
vi.mock("../application/tanita/sync-tanita-import.use-case", () => ({
  syncTanitaImport: vi.fn(),
}));
vi.mock("./use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));

// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NO_FIRE_SETTLE_MS = 5 as const;

const mockedGetExtensionId = vi.mocked(bridgeDiscovery.getExtensionId);
const mockedReadCsv = vi.mocked(readTanitaExportCsv);
const mockedSync = vi.mocked(syncTanitaImport);
const mockedUseDiscoveredBridges = vi.mocked(useDiscoveredBridges);

const TANITA_DISCOVERED: readonly DiscoveredBridge[] = [
  { bridgeId: "tanita-bridge", extensionId: "ext-1" },
];

const settle = () => new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

const NO_POLICY = { ok: false, reason: "no-policy" } as const;

describe("useTanitaImport", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fire the import once when the bridge is discovered", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TANITA_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockResolvedValue(NO_POLICY);

    // Act
    renderHook(() => useTanitaImport("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(1);
    });
    expect(mockedSync.mock.calls[0]?.[1]).toMatchObject({ profileId: "p1" });
  });

  it("should never read the CSV itself — the use case gates that behind policy", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TANITA_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockResolvedValue(NO_POLICY);
    renderHook(() => useTanitaImport("p1"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await waitFor(() => {
      expect(mockedSync).toHaveBeenCalledTimes(1);
    });

    // Assert
    expect(mockedReadCsv).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: "profileId is null",
      bridges: TANITA_DISCOVERED,
      extensionId: "ext-1",
      profileId: null,
    },
    {
      scenario: "tanita-bridge is not discovered",
      bridges: [] as DiscoveredBridge[],
      extensionId: "ext-1",
      profileId: "p1",
    },
    {
      scenario: "getExtensionId returns null",
      bridges: TANITA_DISCOVERED,
      extensionId: null,
      profileId: "p1",
    },
  ])(
    "should not import when $scenario",
    async ({ bridges, extensionId, profileId }) => {
      // Arrange
      mockedUseDiscoveredBridges.mockReturnValue(bridges);
      mockedGetExtensionId.mockReturnValue(extensionId);
      renderHook(() => useTanitaImport(profileId), {
        wrapper: ({ children }) => wrap(children),
      });

      // Act
      await settle();

      // Assert
      expect(mockedSync).not.toHaveBeenCalled();
      expect(mockedReadCsv).not.toHaveBeenCalled();
    }
  );

  it("should stay single-shot per profile across re-renders, then fire again for a new profileId", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TANITA_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockResolvedValue(NO_POLICY);
    const { rerender } = renderHook(
      ({ profileId }: { profileId: string | null }) =>
        useTanitaImport(profileId),
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

  it("should swallow a rejected import without an unhandled rejection", async () => {
    // Arrange
    mockedUseDiscoveredBridges.mockReturnValue(TANITA_DISCOVERED);
    mockedGetExtensionId.mockReturnValue("ext-1");
    mockedSync.mockRejectedValue(new Error("bridge exploded"));
    renderHook(() => useTanitaImport("p1"), {
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
