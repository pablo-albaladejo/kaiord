import { describe, expect, it } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import {
  CALIBRATION_REQUEST,
  MAX_HIDDEN_OVERHEAD_TOKENS,
  calibrate,
} from "./calibration-call";
import { createLiveSession } from "./live-session";
import type { ClaudeRequest } from "./clean-context-args";
import type { CliRun } from "./stream-messages";

const UNCACHED = 600;
const CACHE_READ = 70;
const UNCACHED_LEAKY = 900;
const CACHE_READ_LEAKY = 101;
const LIMIT = 1000;

const FIELD = { path: ["utilization"], scale: "fraction" } as const;

const sessionReturning = (run: () => CliRun) => {
  const requests: Array<ClaudeRequest> = [];
  const session = createLiveSession({
    spawnClaude: async (request) => {
      requests.push(request);
      return run();
    },
    maxCalls: 3,
    maxWeekly: 0.85,
    field: FIELD,
  });
  return { session, requests };
};

const withInput = (input: number, cacheRead = 0) =>
  cliRun({ usage: { input, output: 1, cacheRead, cacheWrite: 0 } }, [
    { status: "allowed", utilization: 0.1 },
  ]);

describe("calibrate", () => {
  it("should send the fixed minimal prompt and count it against the budget", async () => {
    // Arrange
    const { session, requests } = sessionReturning(() =>
      withInput(UNCACHED, CACHE_READ)
    );

    // Act
    const calibration = await calibrate(session, "claude-sonnet-5");

    // Assert
    expect(requests).toEqual([
      { modelId: "claude-sonnet-5", ...CALIBRATION_REQUEST },
    ]);
    expect(calibration).toMatchObject({ ok: true, overheadTokens: 670 });
    expect(session.callsMade()).toBe(1);
  });

  it("should stop with a context-leak fault above 1000 input tokens, cache included", async () => {
    // Arrange
    const { session } = sessionReturning(() =>
      withInput(UNCACHED_LEAKY, CACHE_READ_LEAKY)
    );

    // Act
    const calibration = await calibrate(session, "claude-sonnet-5");

    // Assert
    expect(MAX_HIDDEN_OVERHEAD_TOKENS).toBe(LIMIT);
    expect(calibration.ok).toBe(false);
    expect(session.stopped()?.kind).toBe("context-leak");
    expect(session.stopped()?.reason).toContain("1001 input tokens");
  });

  it("should accept exactly 1000 input tokens", async () => {
    // Arrange
    const { session } = sessionReturning(() => withInput(LIMIT));

    // Act
    const calibration = await calibrate(session, "claude-sonnet-5");

    // Assert
    expect(calibration.ok).toBe(true);
  });

  it("should report a failed calibration call as the stop it caused", async () => {
    // Arrange
    const { session } = sessionReturning(() => {
      throw new Error("spawn failed");
    });

    // Act
    const calibration = await calibrate(session, "claude-sonnet-5");

    // Assert
    expect(calibration).toEqual({
      ok: false,
      stop: { kind: "harness-fault", reason: "spawn failed" },
    });
  });
});
