import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem, ZonesPayload } from "../../types/coaching-zones";

const mockLazyImport = vi.fn<(load: unknown) => Promise<unknown>>();

vi.mock("../../lib/lazy-import", () => ({
  lazyImport: (load: unknown) => mockLazyImport(load),
}));

import { useZonesSyncOrchestrator } from "./use-zones-sync-orchestrator";

// The toast's title, and the Train2Go Connection's own notice as its detail.
const ZONES_FETCH_FAILED = [
  "Your zones were not synced.",
  "Train2Go is not answering, so you cannot use it in Kaiord right now.",
] as const;

type ToastSpy = ReturnType<typeof useToast>;

const buildToasts = (): ToastSpy =>
  ({ error: vi.fn(), warning: vi.fn(), info: vi.fn() }) as unknown as ToastSpy;

const persistence = {} as PersistencePort;
const transport = {} as CoachingTransport;
const conflict: ConflictItem = {
  field: "cycling.ftp",
  current: 200,
  incoming: 210,
};
const payload = { cycling: { ftp: 210 } } as unknown as ZonesPayload;
const loadFailure = new Error("lazy import failed");

describe("useZonesSyncOrchestrator with a failed import", () => {
  beforeEach(() => {
    localStorage.clear();
    mockLazyImport.mockReset();
  });

  it("should toast a failed fetch when the sync use case fails to load", async () => {
    // Arrange
    mockLazyImport.mockRejectedValue(loadFailure);
    const toasts = buildToasts();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts, vi.fn())
    );

    // Act
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(...ZONES_FETCH_FAILED);
  });

  it("should toast a failed fetch when taking Train2Go's numbers fails to load", async () => {
    // Arrange
    mockLazyImport
      .mockResolvedValueOnce({
        syncZones: async () => ({
          ok: true,
          applied: [],
          conflicts: [conflict],
          payload,
        }),
      })
      .mockRejectedValueOnce(loadFailure);
    const toasts = buildToasts();
    const offer = vi.fn();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts, offer)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });
    const takeTheirs = offer.mock.calls[0]?.[0] as () => Promise<void>;

    // Act
    await act(async () => {
      await takeTheirs();
    });

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(...ZONES_FETCH_FAILED);
  });
});
