import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem, SyncZonesResult } from "../../types/coaching-zones";

const mockSyncZones = vi.fn<(...args: unknown[]) => Promise<SyncZonesResult>>();
const mockCommit = vi.fn<(...args: unknown[]) => Promise<void>>();

vi.mock("../../application/coaching/sync-zones", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    syncZones: (...args: unknown[]) => mockSyncZones(...args),
  };
});

vi.mock("../../application/coaching/commit-conflict-resolution", () => ({
  commitConflictResolution: (...args: unknown[]) => mockCommit(...args),
}));

import { useZonesSyncOrchestrator } from "./use-zones-sync-orchestrator";
import { openZonesOffer, rememberZonesOffer } from "./zones-offer-memo";

// The toast's title, and the Train2Go Connection's own notice as its detail.
const ZONES_FETCH_FAILED = [
  "Your zones were not synced.",
  "Train2Go is not answering, so you cannot use it in Kaiord right now.",
] as const;
const ZONES_SHAPE_MISMATCH =
  "Train2Go sent zones Kaiord cannot read, so they were not synced.";
const ZONES_UNSUPPORTED = "This coaching platform does not share zones.";

type ToastSpy = ReturnType<typeof useToast>;

const buildToasts = (): ToastSpy =>
  ({
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    toast: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
    toasts: [],
  }) as unknown as ToastSpy;

const persistence = { profiles: {} as object } as unknown as PersistencePort;
const showNotLoaded = vi.fn();
const transport = {} as CoachingTransport;

const sampleConflict: ConflictItem = {
  field: "cycling.thresholds.ftp",
  current: 200,
  incoming: 210,
};
const TAKEN_THRESHOLDS = "Kaiord now uses Train2Go's thresholds.";

const differing = (conflicts: ConflictItem[]): SyncZonesResult => ({
  ok: true,
  applied: [],
  conflicts,
});

const syncedWithOffer = async (toasts = buildToasts()) => {
  mockSyncZones.mockResolvedValue(differing([sampleConflict]));
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
  return { offer, result, toasts };
};

describe("useZonesSyncOrchestrator", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSyncZones.mockReset();
    mockCommit.mockReset();
    mockCommit.mockResolvedValue(undefined);
  });

  it("should call toasts.error with ZONES_FETCH_FAILED when syncZones returns transport-error", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({ ok: false, reason: "transport-error" });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        toasts,
        vi.fn(),
        showNotLoaded
      )
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(...ZONES_FETCH_FAILED);
  });

  it("should call toasts.warning with ZONES_SHAPE_MISMATCH when reason is shape-mismatch", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({ ok: false, reason: "shape-mismatch" });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        toasts,
        vi.fn(),
        showNotLoaded
      )
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.warning).toHaveBeenCalledWith(ZONES_SHAPE_MISMATCH);
  });

  it("should call toasts.info with ZONES_UNSUPPORTED when reason is unsupported", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({ ok: false, reason: "unsupported" });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        toasts,
        vi.fn(),
        showNotLoaded
      )
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.info).toHaveBeenCalledWith(ZONES_UNSUPPORTED);
  });

  it("should keep the athlete's numbers and ask nothing when Train2Go reports different ones", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue(differing([sampleConflict]));
    const offer = vi.fn();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        buildToasts(),
        offer,
        showNotLoaded
      )
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(mockCommit).not.toHaveBeenCalled();
    expect(offer).toHaveBeenCalledTimes(1);
    expect(offer.mock.calls[0]?.[0]).toBe("thresholds");
  });

  it("should take Train2Go's numbers when the athlete uses the offer", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue(differing([sampleConflict]));
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
    await act(async () => {
      await result.current.runSync("p1");
    });
    const takeTheirs = offer.mock.calls[0]?.[1] as () => Promise<void>;

    // Act
    await act(async () => {
      await takeTheirs();
    });

    // Assert
    expect(mockCommit).toHaveBeenCalledWith(
      "p1",
      [sampleConflict],
      persistence
    );
  });

  it("should not offer the same different numbers twice", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue(differing([sampleConflict]));
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
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Act
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(offer).toHaveBeenCalledTimes(1);
  });

  it("should offer nothing when Train2Go agrees with the athlete", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue(differing([]));
    const offer = vi.fn();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        buildToasts(),
        offer,
        showNotLoaded
      )
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(offer).not.toHaveBeenCalled();
  });

  it("should keep the offer open for the Athlete page once its notice is gone", async () => {
    // Arrange
    // Act
    await syncedWithOffer();

    // Assert
    expect(openZonesOffer("p1")).toEqual([sampleConflict]);
  });

  it("should close the offer and say what changed once Train2Go's numbers are taken", async () => {
    // Arrange
    const { offer, toasts } = await syncedWithOffer();
    const takeTheirs = offer.mock.calls[0]?.[1] as () => Promise<void>;

    // Act
    await act(async () => {
      await takeTheirs();
    });

    // Assert
    expect(openZonesOffer("p1")).toEqual([]);
    expect(toasts.success).toHaveBeenCalledWith(TAKEN_THRESHOLDS);
  });

  it("should forget an open offer once Train2Go agrees with the athlete", async () => {
    // Arrange
    rememberZonesOffer("p1", [sampleConflict]);
    mockSyncZones.mockResolvedValue(differing([]));
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(
        persistence,
        transport,
        buildToasts(),
        vi.fn(),
        showNotLoaded
      )
    );

    // Act
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(openZonesOffer("p1")).toEqual([]);
  });
});
