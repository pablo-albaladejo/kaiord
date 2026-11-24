/**
 * A send to TrainingPeaks whose answer never arrived, against a fake
 * TrainingPeaks that holds state: the real push hook, export gate and Dexie
 * ledger, with only the extension's message channel replaced. The send
 * lands (TrainingPeaks created it) but the App times out; the next send of
 * that Workout reads the day first and never adds a second copy unasked,
 * and never changes or deletes what it finds.
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
  /** The next workout POST lands, but its answer never arrives. */
  hangNextPush: false,
  /** The day read fails. */
  dayDown: false,
  requests: [] as { method: string; path: string }[],
}));

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: () => "tp-extension" },
}));

vi.mock("../adapters/bridge/bridge-transport", () => {
  const raw = (payload: unknown) => ({
    ok: true,
    protocolVersion: 2,
    data: {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    },
  });
  const failure = (status: number) => ({
    ok: false,
    protocolVersion: 2,
    status,
    error: `Request failed: ${status}`,
  });
  const NO_ANSWER = "Extension did not respond";
  const SERVICE_UNAVAILABLE = 503;
  return {
    NO_ANSWER_ERROR: NO_ANSWER,
    sendBridgeMessage: async (
      _id: string,
      message: Record<string, unknown>
    ) => {
      if (message.action === "read-athlete-id")
        return { ok: true, protocolVersion: 2, data: { athleteId: 77 } };
      if (message.action !== "request") return failure(400);
      const path = String(message.path);
      const method = String(message.method);
      tp.requests.push({ method, path });
      if (method === "POST" && path === "/fitness/v6/athletes/77/workouts") {
        const workoutId = tp.nextId++;
        tp.workouts.set(workoutId, { ...(message.body as object), workoutId });
        if (tp.hangNextPush) {
          tp.hangNextPush = false;
          return { ok: false, delivered: false, error: NO_ANSWER };
        }
        return raw({ workoutId });
      }
      const day =
        /^\/fitness\/v6\/athletes\/77\/workouts\/(\d{4}-\d{2}-\d{2})\/\1$/.exec(
          path
        );
      if (method === "GET" && day) {
        if (tp.dayDown) return failure(SERVICE_UNAVAILABLE);
        return raw(
          [...tp.workouts.values()]
            .filter((w) => w.workoutDay === day[1])
            .map((w) => ({ ...w, workoutDay: `${day[1]}T00:00:00` }))
        );
      }
      const one = /^\/fitness\/v6\/athletes\/77\/workouts\/(\d+)$/.exec(path);
      if (method === "GET" && one) {
        const found = tp.workouts.get(Number(one[1]));
        return found ? raw(found) : failure(404);
      }
      return failure(400);
    },
  };
});

vi.mock("@kaiord/trainingpeaks", () => ({
  krdToTrainingPeaksWorkout: (
    krd: { name: string },
    opts: { athleteId: number; workoutDay: string }
  ) => ({
    athleteId: opts.athleteId,
    workoutDay: opts.workoutDay,
    title: krd.name,
  }),
}));

vi.mock("../contexts", () => ({
  useAnalytics: () => ({ event: vi.fn() }),
}));

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ profile: { sportZones: [] } }),
}));

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const DAY = "2026-11-24";

const record = (name: string, date = DAY): WorkoutRecord =>
  ({
    id: "22222222-2222-4222-8222-222222222222",
    profileId: PROFILE_ID,
    date,
    sport: "running",
    krd: { name },
  }) as unknown as WorkoutRecord;

const send = async (
  workout: WorkoutRecord,
  options?: { sendAnyway?: boolean }
) => {
  const { result } = renderHook(() => useTrainingPeaksPush(workout));
  return result.current.push(options);
};

const titles = () => [...tp.workouts.values()].map((w) => w.title);
const writes = () =>
  tp.requests.filter((r) => r.method !== "GET").map((r) => r.method);

describe("useTrainingPeaksPush after a send that got no answer", () => {
  beforeEach(async () => {
    tp.workouts.clear();
    tp.requests.length = 0;
    tp.hangNextPush = false;
    tp.dayDown = false;
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

  it("should not send again and ask when the day already holds a workout of that title", async () => {
    // Arrange
    tp.hangNextPush = true;
    const first = await send(record("Easy run"));
    const before = structuredClone([...tp.workouts.entries()]);

    // Act
    const next = await send(record("Easy run"));

    // Assert
    expect(first.ok).toBe(false);
    expect(next).toEqual({
      ok: false,
      block: { blocked: true, reason: "may-be-there", date: DAY },
    });
    expect(titles()).toEqual(["Easy run"]);
    expect([...tp.workouts.entries()]).toEqual(before);
    expect(writes()).toEqual(["POST"]);
  });

  it("should send when the day holds no workout of that title", async () => {
    // Arrange
    tp.hangNextPush = true;
    await send(record("Easy run"));
    tp.workouts.clear();

    // Act
    const next = await send(record("Easy run"));

    // Assert
    expect(next.ok).toBe(true);
    expect(titles()).toEqual(["Easy run"]);
  });

  it("should say it could not check, and send nothing, when the day cannot be read", async () => {
    // Arrange
    tp.hangNextPush = true;
    await send(record("Easy run"));
    tp.dayDown = true;

    // Act
    const next = await send(record("Easy run"));

    // Assert
    expect(next).toEqual({
      ok: false,
      block: { blocked: true, reason: "unchecked", date: DAY },
    });
    expect(writes()).toEqual(["POST"]);
  });

  it("should send a second copy only when the athlete chooses to send anyway", async () => {
    // Arrange
    tp.hangNextPush = true;
    await send(record("Easy run"));
    await send(record("Easy run"));

    // Act
    const anyway = await send(record("Easy run"), { sendAnyway: true });

    // Assert
    expect(anyway.ok).toBe(true);
    expect(titles()).toEqual(["Easy run", "Easy run"]);
    expect(writes()).toEqual(["POST", "POST"]);
  });

  it("should ask once more after sending anyway only if that send also got no answer", async () => {
    // Arrange
    tp.hangNextPush = true;
    await send(record("Easy run"));
    await send(record("Easy run"), { sendAnyway: true });

    // Act
    const next = await send(record("Easy run"));

    // Assert
    expect(next.ok).toBe(true);
    expect(tp.workouts.size).toBe(2);
  });

  it("should read the day the unanswered send went to after the Workout moved", async () => {
    // Arrange
    tp.hangNextPush = true;
    await send(record("Easy run"));

    // Act
    const moved = await send(record("Easy run", "2026-11-25"));

    // Assert
    expect(moved).toEqual({
      ok: false,
      block: { blocked: true, reason: "may-be-there", date: DAY },
    });
    expect(tp.requests.at(-1)?.path).toBe(
      `/fitness/v6/athletes/77/workouts/${DAY}/${DAY}`
    );
  });

  it("should neither read the day nor ask when every earlier send was answered", async () => {
    // Arrange
    await send(record("Easy run"));
    tp.workouts.clear();

    // Act
    const again = await send(record("Easy run"));

    // Assert
    expect(again.ok).toBe(true);
    expect(tp.requests.some((r) => r.path.endsWith(`${DAY}/${DAY}`))).toBe(
      false
    );
  });
});
