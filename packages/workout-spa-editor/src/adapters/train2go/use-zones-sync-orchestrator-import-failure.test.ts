import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { TOAST_ZONES_FETCH_FAILED } from "../../application/coaching/sync-zones-toasts";
import type { useToast } from "../../hooks/use-toast";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem, ZonesPayload } from "../../types/coaching-zones";

const mockLazyImport = vi.fn<(load: unknown) => Promise<unknown>>();

vi.mock("../../lib/lazy-import", () => ({
  lazyImport: (load: unknown) => mockLazyImport(load),
}));

import { useZonesSyncOrchestrator } from "./use-zones-sync-orchestrator";

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
    mockLazyImport.mockReset();
  });

  it("should toast a failed fetch when the sync use case fails to load", async () => {
    // Arrange
    mockLazyImport.mockRejectedValue(loadFailure);
    const toasts = buildToasts();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );

    // Act
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(TOAST_ZONES_FETCH_FAILED);
    expect(result.current.pending).toBeNull();
  });

  it("should toast a failed fetch and keep the decisions pending when the commit fails to load", async () => {
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
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Act
    await act(async () => {
      await result.current.confirmDecisions({ "cycling.ftp": "accept" });
    });

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(TOAST_ZONES_FETCH_FAILED);
    expect(result.current.pending).toEqual({
      profileId: "p1",
      conflicts: [conflict],
      payload,
    });
  });
});
