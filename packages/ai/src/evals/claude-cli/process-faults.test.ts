import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSpawnDouble,
  initMessage,
  resultMessage,
  streamOf,
} from "../../test-utils/claude-cli-doubles";
import { isHarnessFault } from "./harness-fault";
import { runProcess } from "./run-process";
import { createSpawnClaude } from "./spawn-claude";

const TIMEOUT_MS = 1000;
const FAILED_EXIT = 3;
const REQUEST = {
  modelId: "claude-sonnet-5",
  system: "s",
  prompt: "p",
  jsonSchema: { type: "object" },
};

const faultOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "resolved",
    (error) => (isHarnessFault(error) ? error.message : `other: ${error}`)
  );

describe("process faults", () => {
  afterEach(() => vi.useRealTimers());

  it("should kill a child that outlives its timeout and raise a harness fault", async () => {
    // Arrange
    vi.useFakeTimers();
    const double = createSpawnDouble(() => ({ hang: true }));
    const run = faultOf(
      runProcess(double.spawn, "claude", [], {
        cwd: "/nowhere",
        env: {},
        input: "",
        timeoutMs: TIMEOUT_MS,
      })
    );

    // Act
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    // Assert
    expect(await run).toContain(`did not exit within ${TIMEOUT_MS} ms`);
    expect(double.killed).toEqual(["SIGKILL"]);
  });

  it("should treat a non-zero exit as a harness fault even when the stream parses", async () => {
    // Arrange
    const stdout = streamOf(initMessage(), resultMessage());
    const double = createSpawnDouble(() => ({ stdout, code: FAILED_EXIT }));
    const spawnClaude = createSpawnClaude({ env: {}, spawn: double.spawn });

    // Act
    const fault = await faultOf(spawnClaude(REQUEST));

    // Assert
    expect(fault).toBe(`the CLI exited with code ${FAILED_EXIT}`);
  });

  it("should turn an EPIPE on stdin into a harness fault", async () => {
    // Arrange
    const epipe = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    const double = createSpawnDouble(() => ({ stdinError: epipe }));

    // Act
    const fault = await faultOf(
      runProcess(double.spawn, "claude", [], {
        cwd: "/nowhere",
        env: {},
        input: "p",
      })
    );

    // Assert
    expect(fault).toBe("could not write the prompt to claude: write EPIPE");
    expect(double.killed).toEqual(["SIGKILL"]);
  });
});
