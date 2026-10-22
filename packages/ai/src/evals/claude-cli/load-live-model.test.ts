import { describe, expect, it } from "vitest";

import {
  createSpawnDouble,
  initMessage,
  rateLimitEvent,
  resultMessage,
  streamOf,
} from "../../test-utils/claude-cli-doubles";
import type { SpawnCall } from "../../test-utils/claude-cli-doubles";
import { CALIBRATION_REQUEST } from "./calibration-call";
import { loadLiveModel } from "./load-live-model";

const AUTH_OK = JSON.stringify({
  loggedIn: true,
  authMethod: "claude.ai",
  apiProvider: "firstParty",
});
const CALL_OK = streamOf(
  initMessage(),
  rateLimitEvent({ status: "allowed", utilization: 0.1 }),
  resultMessage()
);

const reply = (call: SpawnCall) => ({
  stdout: call.args[0] === "auth" ? AUTH_OK : CALL_OK,
});

const loadError = (env: Record<string, string>) => {
  const double = createSpawnDouble(reply);
  return loadLiveModel({ env, spawn: double.spawn }).then(
    () => ({ message: "loaded", calls: double.calls }),
    (error: Error) => ({ message: error.message, calls: double.calls })
  );
};

describe("loadLiveModel", () => {
  it("should fail INERT in CI before spawning anything", async () => {
    // Arrange
    const env = { CI: "1", EVAL_LIVE: "1" };

    // Act
    const { message, calls } = await loadError(env);

    // Assert
    expect(message).toMatch(/^INERT: claude CLI not available: CI is set/);
    expect(calls).toHaveLength(0);
  });

  it("should fail INERT without the EVAL_LIVE opt-in before spawning anything", async () => {
    // Arrange
    const env = { PATH: "/usr/bin" };

    // Act
    const { message, calls } = await loadError(env);

    // Assert
    expect(message).toMatch(/^INERT: claude CLI not available: EVAL_LIVE/);
    expect(calls).toHaveLength(0);
  });

  it("should default to the official model and route calls through one session", async () => {
    // Arrange
    const double = createSpawnDouble(reply);
    const live = await loadLiveModel({
      env: { EVAL_LIVE: "1" },
      spawn: double.spawn,
      field: { path: ["utilization"], scale: "fraction" },
    });

    // Act
    await live.session.call({ modelId: live.modelId, ...CALIBRATION_REQUEST });

    // Assert
    expect(live.modelId).toBe("claude-sonnet-5");
    expect(live.model.modelId).toBe("claude-sonnet-5");
    expect(double.calls.map((c) => c.args[0])).toEqual(["auth", "-p"]);
    expect(live.session.callsMade()).toBe(1);
    expect(live.session.stopped()).toBeUndefined();
  });

  it("should ship fail-closed: the unpinned guard stops the pass after one call", async () => {
    // Arrange
    const double = createSpawnDouble(reply);
    const live = await loadLiveModel({
      env: { EVAL_LIVE: "1" },
      spawn: double.spawn,
    });

    // Act
    await live.session.call({ modelId: live.modelId, ...CALIBRATION_REQUEST });

    // Assert
    expect(live.session.stopped()?.kind).toBe("harness-fault");
    expect(live.session.stopped()?.reason).toContain("SEVEN_DAY_FIELD");
  });
});
