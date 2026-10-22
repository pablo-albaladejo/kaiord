import { describe, expect, it } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import { isHarnessFault } from "./harness-fault";
import { DEFAULT_MAX_CALLS, readMaxCalls } from "./live-config";
import { createLiveSession } from "./live-session";
import type { WeeklyField } from "./rate-limit-guard";
import type { CliRun } from "./stream-messages";

const LOW = 0.1;
const ABOVE = 0.86;
const BUDGET = 3;
const DEFAULT = 50;
const TWO_CALLS_COST = 0.02;

const FIELD: WeeklyField = { path: ["utilization"], scale: "fraction" };
const REQUEST = { modelId: "claude-sonnet-5", system: "s", prompt: "p" };
const allowed = (utilization: number) =>
  cliRun({}, [{ status: "allowed", utilization }]);

const sessionOver = (replies: () => Promise<CliRun>, maxCalls = 50) => {
  let spawned = 0;
  const session = createLiveSession({
    spawnClaude: () => {
      spawned++;
      return replies();
    },
    maxCalls,
    maxWeekly: 0.85,
    field: FIELD,
  });
  return { session, spawned: () => spawned };
};

const settle = async (promise: Promise<unknown>) =>
  promise.then(
    () => "ok",
    (error) => (isHarnessFault(error) ? "fault" : "error")
  );

describe("createLiveSession", () => {
  it("should make at most EVAL_MAX_CALLS=3 calls and refuse the rest", async () => {
    // Arrange
    const { session, spawned } = sessionOver(async () => allowed(LOW), BUDGET);

    // Act
    const outcomes = [];
    for (let i = 0; i < BUDGET + 2; i++)
      outcomes.push(await settle(session.call(REQUEST)));

    // Assert
    expect(spawned()).toBe(BUDGET);
    expect(outcomes).toEqual(["ok", "ok", "ok", "fault", "fault"]);
    expect(session.stopped()?.kind).toBe("budget");
  });

  it("should default to a finite budget of 50 calls", async () => {
    // Arrange
    const maxCalls = readMaxCalls({});
    const { session, spawned } = sessionOver(
      async () => allowed(LOW),
      maxCalls
    );

    // Act
    for (let i = 0; i < DEFAULT * 2; i++) await settle(session.call(REQUEST));

    // Assert
    expect(DEFAULT_MAX_CALLS).toBe(DEFAULT);
    expect(spawned()).toBe(DEFAULT);
    expect(session.callsMade()).toBe(DEFAULT);
  });

  it("should run one call at a time and fault a concurrent one", async () => {
    // Arrange
    const { session, spawned } = sessionOver(async () => allowed(LOW));

    // Act
    const [first, second] = await Promise.all([
      settle(session.call(REQUEST)),
      settle(session.call(REQUEST)),
    ]);

    // Assert
    expect([first, second]).toEqual(["ok", "fault"]);
    expect(spawned()).toBe(1);
    expect(session.stopped()?.kind).toBe("harness-fault");
  });

  it("should return the call that crossed the limit and refuse the next", async () => {
    // Arrange
    const { session, spawned } = sessionOver(async () => allowed(ABOVE));

    // Act
    const first = await session.call(REQUEST);
    const second = await settle(session.call(REQUEST));

    // Assert
    expect(first.result.structuredOutput).toEqual({ ok: true });
    expect(second).toBe("fault");
    expect(spawned()).toBe(1);
    expect(session.stopped()?.kind).toBe("rate-limit");
  });

  it("should stop the pass when a call fails", async () => {
    // Arrange
    const { session } = sessionOver(async () => {
      throw new Error("spawn failed");
    });

    // Act
    const outcome = await settle(session.call(REQUEST));

    // Assert
    expect(outcome).toBe("error");
    expect(session.stopped()).toEqual({
      kind: "harness-fault",
      reason: "spawn failed",
    });
  });

  it("should add up the API-equivalent cost of every call", async () => {
    // Arrange
    const { session } = sessionOver(async () => allowed(LOW));

    // Act
    await session.call(REQUEST);
    await session.call(REQUEST);

    // Assert
    expect(session.apiEquivalentCostUsd()).toBeCloseTo(TWO_CALLS_COST);
  });
});
