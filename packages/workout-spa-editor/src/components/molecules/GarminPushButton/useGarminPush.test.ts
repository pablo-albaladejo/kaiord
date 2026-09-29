import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminBridgeState } from "../../../contexts";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { IntegrationPolicy } from "../../../types/integration-policy";

const mockPushWorkout = vi.fn();
const mockSetPushing = vi.fn();
const mockAnalyticsEvent = vi.fn();

const garminState: Pick<
  GarminBridgeState,
  "pushWorkout" | "setPushing" | "sessionActive" | "features"
> = {
  pushWorkout: mockPushWorkout,
  setPushing: mockSetPushing,
  sessionActive: true,
  features: ["calendar-write-v1", "calendar-find-v1"],
};

vi.mock("../../../contexts", () => ({
  useGarminBridge: vi.fn(() => ({ ...garminState })),
  useAnalytics: vi.fn(() => ({ event: mockAnalyticsEvent, pageView: vi.fn() })),
}));

const mockExportGcnWorkout = vi.fn();

vi.mock("../../../utils/export-workout-formats", () => ({
  exportGcnWorkout: (...args: unknown[]) =>
    mockExportGcnWorkout(...args) as unknown,
}));

const mockPut = vi.fn();
const mockGet = vi.fn();

vi.mock("../../../adapters/dexie/dexie-database", () => ({
  db: {
    table: () => ({
      put: (record: unknown) => mockPut(record) as void,
      get: (id: unknown) => mockGet(id) as unknown,
    }),
  },
}));

vi.mock("../../../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));
vi.mock("../../../adapters/dexie/dexie-export-ledger-repository", () => ({
  createDexieExportLedgerRepository: () => ({}),
}));

const ENABLED_GARMIN_POLICY: IntegrationPolicy = {
  id: "00000000-0000-0000-0000-000000000001",
  profileId: "profile-1",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
};

// Governs the destination policy the executeWorkoutPush gate sees —
// defaults to an active route so existing push-mechanics tests exercise
// the happy path; individual tests override it to exercise the gate.
let mockPolicies: IntegrationPolicy[] = [ENABLED_GARMIN_POLICY];

vi.mock(
  "../../../application/integration-policy/resolve-export-policies.use-case",
  () => ({
    resolveExportPolicies: async () => mockPolicies,
  })
);

// The real pipeline over in-memory ports: a fresh ledger and calendar each
// time the hook builds its deps.
vi.mock("../../../hooks/garmin-placement-deps", async () => {
  const { createInMemoryExportLedgerRepository } =
    await import("../../../test-utils/in-memory-export-ledger-repository");
  const { createFakeGarminCalendar } =
    await import("../../../test-utils/fake-garmin-calendar");
  const { createInMemoryLockManager } =
    await import("../../../test-utils/in-memory-record-lock");
  const joins = new Map();
  return {
    buildPlacementDeps: (features: readonly string[], analytics: unknown) => ({
      analytics,
      ledgerRepo: createInMemoryExportLedgerRepository(),
      calendar: createFakeGarminCalendar().port,
      scheduleIdsInFind: true,
      now: () => Date.now(),
      sleep: async () => undefined,
      features,
      locks: createInMemoryLockManager().port(),
      secureContext: true,
      joins,
    }),
  };
});

import { MissingPaceZonesError } from "../../../utils/garmin-pace-zones";
import { useGarminPush } from "./useGarminPush";

// A stub KRD payload that exportGcnWorkout will receive verbatim.
const KRD_STUB = { name: "test workout" } as unknown;

const makeWorkout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "workout-1",
    profileId: "profile-1",
    date: "2026-05-14",
    sport: "cycling",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "ready",
    raw: null,
    krd: KRD_STUB,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-05-14T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-05-14T08:00:00.000Z",
    ...overrides,
  }) as unknown as WorkoutRecord;

describe("useGarminPush", () => {
  beforeEach(() => {
    garminState.sessionActive = true;
    mockPolicies = [ENABLED_GARMIN_POLICY];
    mockPushWorkout.mockResolvedValue({
      success: true,
      garminWorkoutId: "1707805999",
    });
    mockExportGcnWorkout.mockResolvedValue({ gcnWorkout: "data" });
    mockGet.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should accept WorkoutRecord argument and push without reading from Zustand store", async () => {
    // Arrange
    const workout = makeWorkout();
    const gcn = { gcnWorkout: "data" };
    mockExportGcnWorkout.mockResolvedValue(gcn);
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockExportGcnWorkout).toHaveBeenCalledWith(KRD_STUB, undefined);
    expect(mockPushWorkout).toHaveBeenCalledWith(gcn);
  });

  it("should resolve the placement and report the confirmed library id upward", async () => {
    // Arrange
    const onSent = vi.fn();
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout, onSent));
    let outcome: unknown;

    // Act
    await act(async () => {
      outcome = await result.current.push();
    });

    // Assert
    expect(outcome).toEqual({ kind: "scheduled" });
    expect(onSent).toHaveBeenCalledWith("1707805999");
  });

  it.each([
    { label: "the workout is undefined", arrange: () => undefined },
    {
      label: "the workout has no krd",
      arrange: () => makeWorkout({ krd: null }),
    },
    {
      label: "the session is not active",
      arrange: () => {
        garminState.sessionActive = false;
        return makeWorkout();
      },
    },
  ])("should do nothing when $label", async ({ arrange }) => {
    // Arrange
    const workout = arrange();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockExportGcnWorkout).not.toHaveBeenCalled();
    expect(mockPushWorkout).not.toHaveBeenCalled();
  });

  it("should set error when exportGcnWorkout throws an Error", async () => {
    // Arrange
    mockExportGcnWorkout.mockRejectedValue(new Error("Conversion failed"));
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Conversion failed",
    });
  });

  it.each([
    ["the export throws before the pipeline starts", "export"],
    ["the bridge push throws inside the pipeline", "push"],
  ])("should emit exactly one placement event when %s", async (_n, where) => {
    // Arrange
    if (where === "export")
      mockExportGcnWorkout.mockRejectedValue(new Error("x"));
    else mockPushWorkout.mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useGarminPush(makeWorkout()));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    const placements = mockAnalyticsEvent.mock.calls.filter(
      ([name]) => name === "garmin-calendar-placement"
    );
    expect(placements).toEqual([
      [
        "garmin-calendar-placement",
        {
          result: "failed",
          reason: "library-push-failed",
          durationMs: expect.any(Number),
          abandonedCount: 0,
        },
      ],
    ]);
  });

  it("should fail with missing-pace-zones, and push nothing, when the profile cannot resolve the pace zones", async () => {
    // Arrange
    mockExportGcnWorkout.mockRejectedValue(new MissingPaceZonesError());
    const { result } = renderHook(() => useGarminPush(makeWorkout()));
    let outcome: unknown;

    // Act
    await act(async () => {
      outcome = await result.current.push();
    });

    // Assert
    expect(outcome).toEqual({
      kind: "failed",
      reason: "missing-pace-zones",
      retryable: false,
    });
    expect(mockPushWorkout).not.toHaveBeenCalled();
    expect(mockSetPushing).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" })
    );
    expect(mockAnalyticsEvent).toHaveBeenCalledWith(
      "garmin-calendar-placement",
      expect.objectContaining({ reason: "missing-pace-zones" })
    );
  });

  it("should set fallback error message when non-Error is thrown", async () => {
    // Arrange
    mockExportGcnWorkout.mockRejectedValue("string error");
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Conversion failed",
    });
  });

  it("should set error when pushWorkout throws", async () => {
    // Arrange
    mockPushWorkout.mockRejectedValue(new Error("Push rejected"));
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Push rejected",
    });
  });

  it("should fire garmin-synced success event after successful push", async () => {
    // Arrange
    mockPushWorkout.mockResolvedValue({
      success: true,
      garminWorkoutId: "1707805999",
    });
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockAnalyticsEvent).toHaveBeenCalledWith("garmin-synced", {
      result: "success",
    });
  });

  it("should fire garmin-synced once when a second push joins the running one", async () => {
    // Arrange
    mockPushWorkout.mockResolvedValue({
      success: true,
      garminWorkoutId: "1707805999",
    });
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await Promise.all([result.current.push(), result.current.push()]);
    });

    // Assert
    const synced = mockAnalyticsEvent.mock.calls.filter(
      ([name]) => name === "garmin-synced"
    );
    expect(synced).toEqual([["garmin-synced", { result: "success" }]]);
  });

  it("should fire garmin-synced failure event when the bridge reports a failed push (an outcome that never throws)", async () => {
    // Arrange
    mockPushWorkout.mockResolvedValue({
      success: false,
      garminWorkoutId: null,
    });
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockAnalyticsEvent).toHaveBeenCalledWith("garmin-synced", {
      result: "failure",
    });
    // The bridge's own runPush already set the specific pushing message —
    // the hook must not overwrite it with a generic one.
    expect(mockSetPushing).not.toHaveBeenCalled();
  });

  it("should not persist any workout-state transition (owned by useEditorActions)", async () => {
    // Arrange
    mockPushWorkout.mockResolvedValue({
      success: true,
      garminWorkoutId: "1707805999",
    });
    const workout = makeWorkout({ state: "ready" });
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("should fire garmin-synced failure event when push throws", async () => {
    // Arrange
    mockPushWorkout.mockRejectedValue(new Error("Push failed"));
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockAnalyticsEvent).toHaveBeenCalledWith("garmin-synced", {
      result: "failure",
    });
  });

  it("should block the push and never call pushWorkout when no active export route exists", async () => {
    // Arrange
    mockPolicies = [];
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));
    let outcome: unknown;

    // Act
    await act(async () => {
      outcome = await result.current.push();
    });

    // Assert
    expect(mockPushWorkout).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      kind: "failed",
      reason: "no-export-route",
      retryable: false,
    });
  });

  it("should block the push when the only export policy is disabled", async () => {
    // Arrange
    mockPolicies = [{ ...ENABLED_GARMIN_POLICY, enabled: false }];
    const workout = makeWorkout();
    const { result } = renderHook(() => useGarminPush(workout));

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockPushWorkout).not.toHaveBeenCalled();
  });
});
