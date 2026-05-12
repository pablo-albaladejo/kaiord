import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import {
  TOAST_ZONES_FETCH_FAILED,
  TOAST_ZONES_SHAPE_MISMATCH,
  TOAST_ZONES_UNSUPPORTED,
} from "../../application/coaching/sync-zones";
import type { useToast } from "../../hooks/useToast";
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
    mockSyncZones.mockReset();
    mockCommit.mockReset();
    mockCommit.mockResolvedValue(undefined);
  });

  it("should call toasts.error with TOAST_ZONES_FETCH_FAILED when syncZones returns transport-error", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({ ok: false, reason: "transport-error" });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(TOAST_ZONES_FETCH_FAILED);
    expect(result.current.pending).toBeNull();
  });

  it("should call toasts.warning with TOAST_ZONES_SHAPE_MISMATCH when reason is shape-mismatch", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({ ok: false, reason: "shape-mismatch" });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.warning).toHaveBeenCalledWith(TOAST_ZONES_SHAPE_MISMATCH);
    expect(result.current.pending).toBeNull();
  });

  it("should call toasts.info with TOAST_ZONES_UNSUPPORTED when reason is unsupported", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({ ok: false, reason: "unsupported" });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(toasts.info).toHaveBeenCalledWith(TOAST_ZONES_UNSUPPORTED);
    expect(result.current.pending).toBeNull();
  });

  it("should set pending state when syncZones succeeds with conflicts", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(result.current.pending).toEqual({
      profileId: "p1",
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
  });

  it("should NOT set pending when syncZones succeeds with empty conflicts", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [],
      payload: samplePayload,
    });
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Assert
    expect(result.current.pending).toBeNull();
  });

  it("should call commitConflictResolution and clear pending when confirmDecisions runs with pending state", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
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
    expect(mockCommit).toHaveBeenCalledWith(
      "p1",
      { "cycling.ftp": "accept" },
      persistence.profiles,
      samplePayload
    );
    expect(result.current.pending).toBeNull();
  });

  it("should be a no-op when confirmDecisions runs without pending state", async () => {
    // Arrange
    const toasts = buildToasts();

    // Act
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.confirmDecisions({ "cycling.ftp": "accept" });
    });

    // Assert
    expect(mockCommit).not.toHaveBeenCalled();
    expect(result.current.pending).toBeNull();
  });

  it("should clear pending state when cancel is called", async () => {
    // Arrange
    mockSyncZones.mockResolvedValue({
      ok: true,
      applied: [],
      conflicts: [sampleConflict],
      payload: samplePayload,
    });
    const toasts = buildToasts();
    const { result } = renderHook(() =>
      useZonesSyncOrchestrator(persistence, transport, toasts)
    );
    await act(async () => {
      await result.current.runSync("p1");
    });

    // Act
    act(() => {
      result.current.cancel();
    });

    // Assert
    expect(result.current.pending).toBeNull();
  });
});
