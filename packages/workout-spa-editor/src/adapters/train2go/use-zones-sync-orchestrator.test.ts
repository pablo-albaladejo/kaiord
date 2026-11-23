import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictItem,
  SyncZonesResult,
  ZonesPayload,
} from "../../types/coaching-zones";

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
const transport = {} as CoachingTransport;

const sampleConflict: ConflictItem = {
  field: "cycling.ftp",
  current: 200,
  incoming: 210,
};
const samplePayload = { cycling: { ftp: 210 } } as unknown as ZonesPayload;

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
      useZonesSyncOrchestrator(persistence, transport, toasts, vi.fn())
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
      useZonesSyncOrchestrator(persistence, transport, toasts, vi.fn())
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
      useZonesSyncOrchestrator(persistence, transport, toasts, vi.fn())
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.info).toHaveBeenCalledWith(ZONES_UNSUPPORTED);
  });

  it("should keep the athlete's numbers and ask nothing when Train2Go reports different ones", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
    const offer = vi.fn();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, buildToasts(), offer)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(mockCommit).not.toHaveBeenCalled();
    expect(offer).toHaveBeenCalledTimes(1);
  });

  it("should take Train2Go's numbers when the athlete uses the offer", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
    const offer = vi.fn();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, buildToasts(), offer)
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
    expect(mockCommit).toHaveBeenCalledWith(
      "p1",
      { "cycling.ftp": "accept" },
      persistence,
      samplePayload
    );
  });

  it("should not offer the same different numbers twice", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
    const offer = vi.fn();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, buildToasts(), offer)
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
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [],
      payload: samplePayload,
    });
    const offer = vi.fn();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, buildToasts(), offer)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(offer).not.toHaveBeenCalled();
  });
});
