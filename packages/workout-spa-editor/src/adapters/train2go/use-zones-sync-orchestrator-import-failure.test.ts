import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem } from "../../types/coaching-zones";

const mockLazyImport = vi.fn<(load: unknown) => Promise<unknown>>();

vi.mock("../../lib/lazy-import", () => ({
  lazyImport: (load: unknown) => mockLazyImport(load),
}));

import { useZonesSyncOrchestrator } from "./use-zones-sync-orchestrator";

// The App's own failure: Train2Go was never asked, so it is not "not
// answering"; the provider's notice offers a reload instead.
const ZONES_NOT_SYNCED = "Your zones were not synced.";
const showNotLoaded = vi.fn();

type ToastSpy = ReturnType<typeof useToast>;

const buildToasts = (): ToastSpy =>
  ({ error: vi.fn(), warning: vi.fn(), info: vi.fn() }) as unknown as ToastSpy;

const persistence = {} as PersistencePort;
const transport = {} as CoachingTransport;
const conflict: ConflictItem = {
  field: "cycling.thresholds.ftp",
  current: 200,
  incoming: 210,
};
const loadFailure = new Error("lazy import failed");

describe("useZonesSyncOrchestrator with a failed import", () => {
  beforeEach(() => {
    localStorage.clear();
    showNotLoaded.mockReset();
    mockLazyImport.mockReset();
    // Past the queued answers, a load runs for real: the Connection notices
    // the failure toast words load through the same `lazyImport`.
    mockLazyImport.mockImplementation((load) =>
      (load as () => Promise<unknown>)()
    );
  });

  it("should say the App did not load, with Reload, when the sync use case fails to load", async () => {
    // Arrange
    mockLazyImport.mockRejectedValueOnce(loadFailure);
    const toasts = buildToasts();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        toasts,
        vi.fn(),
        showNotLoaded
      )
    );

    // Act
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(showNotLoaded).toHaveBeenCalledWith(ZONES_NOT_SYNCED);
    expect(toasts.error).not.toHaveBeenCalled();
  });

  it("should still offer Train2Go's numbers when the offer memo fails to load", async () => {
    // Arrange
    mockLazyImport
      .mockResolvedValueOnce({
        syncZones: async () => ({
          ok: true,
          applied: [],
          conflicts: [conflict],
        }),
      })
      .mockRejectedValueOnce(loadFailure);
    const offer = vi.fn();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        buildToasts(),
        offer,
        showNotLoaded
      )
    );

    // Act
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(offer).toHaveBeenCalledTimes(1);
  });

  it("should say the App did not load, with Reload, when taking Train2Go's numbers fails to load", async () => {
    // Arrange
    // The sync use case, then the offer memo, load; taking Train2Go's
    // numbers then fails to load its use case.
    mockLazyImport
      .mockResolvedValueOnce({
        syncZones: async () => ({
          ok: true,
          applied: [],
          conflicts: [conflict],
        }),
      })
      .mockImplementationOnce((load) => (load as () => Promise<unknown>)())
      .mockRejectedValueOnce(loadFailure);
    const toasts = buildToasts();
    const offer = vi.fn();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        toasts,
        offer,
        showNotLoaded
      )
    );
    await act(async () => {
      await result.current.runSync("p1");
    });
    const takeTheirs = offer.mock.calls[0]?.[1] as () => Promise<void>;

    // Act
    await act(async () => {
      await takeTheirs();
    });

    // Assert
    expect(showNotLoaded).toHaveBeenCalledWith(ZONES_NOT_SYNCED);
    expect(toasts.error).not.toHaveBeenCalled();
  });
});
