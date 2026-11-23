/**
 * Safe writes on TrainingPeaks, against a fake TrainingPeaks that holds
 * state: the real push hook, export gate and Dexie ledger, with only the
 * extension's message channel replaced. TrainingPeaks is create-only for
 * Kaiord, so "send twice, leaves one" is decided by the record of what Kaiord
 * created plus a read of that one workout before the write.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { upsertIntegrationPolicy } from "../application/integration-policy/upsert-integration-policy.use-case";
import type { WorkoutRecord } from "../types/calendar-record";
import { policyRepo } from "./integration-policy-repo";
import { useTrainingPeaksPush } from "./use-trainingpeaks-push";

const tp = vi.hoisted(() => ({
  workouts: new Map<number, Record<string, unknown>>(),
  nextId: 5000,
  readStatus: undefined as number | undefined,
}));

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: () => "tp-extension" },
}));

vi.mock("../adapters/bridge/bridge-transport", () => ({
  sendBridgeMessage: async (_id: string, message: Record<string, unknown>) => {
    if (message.action === "read-athlete-id")
      return { ok: true, data: { athleteId: 77 } };
    if (message.action === "push-workout") {
      const workoutId = tp.nextId++;
      tp.workouts.set(workoutId, {
        ...(message.workout as object),
        workoutId,
      });
      return { ok: true, data: { workoutId } };
    }
    if (message.action === "read-workout") {
      if (tp.readStatus !== undefined)
        return { ok: false, status: tp.readStatus, error: "failed" };
      const found = tp.workouts.get(Number(message.workoutId));
      return found
        ? { ok: true, data: found }
        : { ok: false, status: 404, error: "Workout read failed: 404" };
    }
    return { ok: false, error: "unexpected action" };
  },
}));

vi.mock("@kaiord/trainingpeaks", () => ({
  krdToTrainingPeaksWorkout: (
    krd: { name: string },
    opts: { athleteId: number; workoutDay: string }
  ) => ({ athleteId: opts.athleteId, workoutDay: opts.workoutDay, ...krd }),
}));

vi.mock("../contexts", () => ({
  useAnalytics: () => ({ event: vi.fn() }),
}));

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ profile: { sportZones: [] } }),
}));

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const record = (name: string): WorkoutRecord =>
  ({
    id: "22222222-2222-4222-8222-222222222222",
    profileId: PROFILE_ID,
    date: "2026-11-24",
    sport: "running",
    krd: { name },
  }) as unknown as WorkoutRecord;

const send = async (workout: WorkoutRecord) => {
  const { result } = renderHook(() => useTrainingPeaksPush(workout));
  return result.current.push();
};

describe("useTrainingPeaksPush safe writes", () => {
  beforeEach(async () => {
    tp.workouts.clear();
    tp.readStatus = undefined;
    await db.table("exportLedger").clear();
    await db.table("integrationPolicies").clear();
    await upsertIntegrationPolicy(
      { policyRepo },
      {
        profileId: PROFILE_ID,
        dataType: "workout",
        bridgeId: "trainingpeaks-bridge",
        direction: "export",
        mode: "manual",
        enabled: true,
      }
    );
  });

  it("should leave one workout on TrainingPeaks when the same workout is sent twice", async () => {
    // Arrange
    await send(record("Easy run"));

    // Act
    const second = await send(record("Easy run"));

    // Assert
    expect(second.ok).toBe(true);
    expect(tp.workouts.size).toBe(1);
  });

  it("should send again when the athlete deleted Kaiord's copy on TrainingPeaks", async () => {
    // Arrange
    await send(record("Easy run"));
    tp.workouts.clear();

    // Act
    const again = await send(record("Easy run"));

    // Assert
    expect(again.ok).toBe(true);
    expect(tp.workouts.size).toBe(1);
  });

  it("should send a changed workout without asking when its earlier copy is gone", async () => {
    // Arrange
    await send(record("Easy run"));
    tp.workouts.clear();

    // Act
    const changed = await send(record("Tempo run"));

    // Assert
    expect(changed.ok).toBe(true);
    expect([...tp.workouts.values()].map((w) => w.name)).toEqual(["Tempo run"]);
  });

  it("should ask before a changed workout whose earlier copy is still there", async () => {
    // Arrange
    await send(record("Easy run"));

    // Act
    const changed = await send(record("Tempo run"));

    // Assert
    expect(changed).toEqual({
      ok: false,
      block: { blocked: true, reason: "changed" },
    });
    expect(tp.workouts.size).toBe(1);
  });

  it("should add nothing when TrainingPeaks cannot say whether the copy is there", async () => {
    // Arrange
    await send(record("Easy run"));
    tp.readStatus = 500;

    // Act
    const again = await send(record("Easy run"));

    // Assert
    expect(again.ok).toBe(true);
    expect(tp.workouts.size).toBe(1);
  });
});
