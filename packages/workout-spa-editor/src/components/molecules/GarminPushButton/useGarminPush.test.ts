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
  "pushWorkout" | "setPushing" | "sessionActive"
> = {
  pushWorkout: mockPushWorkout,
  setPushing: mockSetPushing,
  sessionActive: true,
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

const { mockRecordExport } = vi.hoisted(() => ({
  mockRecordExport: vi.fn(
    async (
      _deps: unknown,
      input: {
        postFn: (p: unknown) => Promise<{ externalId: string }>;
        payload: unknown;
      }
    ) => {
      const { externalId } = await input.postFn(input.payload);
      return { ledgerId: "ledger-1", outcome: "created", externalId };
    }
  ),
}));

vi.mock("../../../application/export/record-export.use-case", () => ({
  recordExport: mockRecordExport,
}));

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
      garminWorkoutId: "gw-123",
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
    expect(mockExportGcnWorkout).toHaveBeenCalledWith(KRD_STUB);
    expect(mockPushWorkout).toHaveBeenCalledWith(gcn);
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
      garminWorkoutId: "gw-123",
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
      garminWorkoutId: "gw-123",
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

    // Act
    await act(async () => {
      await result.current.push();
    });

    // Assert
    expect(mockPushWorkout).not.toHaveBeenCalled();
    expect(mockSetPushing).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: expect.stringContaining("garmin-bridge"),
      })
    );
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
