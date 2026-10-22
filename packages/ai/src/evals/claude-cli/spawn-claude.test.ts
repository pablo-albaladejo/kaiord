import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  createSpawnDouble,
  initMessage,
  rateLimitEvent,
  resultMessage,
  streamOf,
} from "../../test-utils/claude-cli-doubles";
import type { SpawnReply } from "../../test-utils/claude-cli-doubles";
import { CLEAN_CONTEXT_FLAGS } from "./clean-context-args";
import { isHarnessFault } from "./harness-fault";
import { createSpawnClaude } from "./spawn-claude";

const REQUEST = {
  modelId: "claude-sonnet-5",
  system: "You parse workouts.",
  prompt: "4x5min at threshold",
  jsonSchema: { type: "object" },
};

const PARENT_ENV = {
  PATH: "/usr/bin",
  HOME: "/home/x",
  ANTHROPIC_API_KEY: "sk-test",
  ANTHROPIC_AUTH_TOKEN: "token",
  ANTHROPIC_BASE_URL: "https://proxy.example",
};

const OK_STREAM = streamOf(
  initMessage(),
  rateLimitEvent({ status: "allowed", utilization: 0.5 }),
  resultMessage()
);

const spawnWith = (reply: () => SpawnReply) => {
  const double = createSpawnDouble(reply);
  const spawnClaude = createSpawnClaude({
    env: PARENT_ENV,
    spawn: double.spawn,
  });
  return { spawnClaude, calls: double.calls };
};

const faultOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return isHarnessFault(error) ? error.message : `not a fault: ${error}`;
  }
  return "resolved";
};

describe("createSpawnClaude", () => {
  it("should pass arguments as an array with the prompt on stdin", async () => {
    // Arrange
    const { spawnClaude, calls } = spawnWith(() => ({ stdout: OK_STREAM }));

    // Act
    await spawnClaude(REQUEST);

    // Assert
    const call = calls[0];
    expect(call?.command).toBe("claude");
    expect(call?.options.shell).toBe(false);
    expect(call?.stdin).toBe(REQUEST.prompt);
    expect(call?.args).toEqual([
      ...CLEAN_CONTEXT_FLAGS,
      "--model",
      "claude-sonnet-5",
      "--system-prompt",
      "You parse workouts.",
      "--json-schema",
      '{"type":"object"}',
    ]);
  });

  it("should never pass ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or ANTHROPIC_BASE_URL", async () => {
    // Arrange
    const { spawnClaude, calls } = spawnWith(() => ({ stdout: OK_STREAM }));

    // Act
    await spawnClaude(REQUEST);

    // Assert
    const env = calls[0]?.options.env ?? {};
    expect(Object.keys(env).filter((k) => k.startsWith("ANTHROPIC"))).toEqual(
      []
    );
    expect(env.MAX_THINKING_TOKENS).toBe("0");
  });

  it("should run from an empty cwd removed after success and after failure", async () => {
    // Arrange
    const ok = spawnWith(() => ({ stdout: OK_STREAM }));
    const broken = spawnWith(() => ({ stdout: "garbage", code: 1 }));

    // Act
    await ok.spawnClaude(REQUEST);
    await faultOf(broken.spawnClaude(REQUEST));

    // Assert
    for (const call of [ok.calls[0], broken.calls[0]]) {
      expect(call?.cwdEntries).toEqual([]);
      expect(existsSync(call?.options.cwd ?? "")).toBe(false);
    }
  });

  it("should return the parsed run with its rate-limit events", async () => {
    // Arrange
    const { spawnClaude } = spawnWith(() => ({ stdout: OK_STREAM }));

    // Act
    const run = await spawnClaude(REQUEST);

    // Assert
    expect(run.init.cliVersion).toBe("2.1.308");
    expect(run.result.structuredOutput).toEqual({ ok: true });
    expect(run.result.usage).toEqual({
      input: 600,
      output: 20,
      cacheRead: 70,
      cacheWrite: 0,
    });
    expect(run.rateLimitInfos).toEqual([
      { status: "allowed", utilization: 0.5 },
    ]);
  });

  it("should abort when the CLI reports an API key source other than none", async () => {
    // Arrange
    const stdout = streamOf(
      initMessage({ apiKeySource: "ANTHROPIC_API_KEY" }),
      resultMessage()
    );
    const { spawnClaude } = spawnWith(() => ({ stdout }));

    // Act
    const fault = await faultOf(spawnClaude(REQUEST));

    // Assert
    expect(fault).toContain("API key source other than none");
  });

  it("should abort when a tool or an MCP server leaked into the context", async () => {
    // Arrange
    const stdout = streamOf(
      initMessage({ tools: ["Bash"], mcp_servers: [{ name: "x" }] }),
      resultMessage()
    );
    const { spawnClaude } = spawnWith(() => ({ stdout }));

    // Act
    const fault = await faultOf(spawnClaude(REQUEST));

    // Assert
    expect(fault).toBe("the clean context leaked: 1 mcpServers, 1 tools");
  });

  it("should abort on an error result or output it cannot parse", async () => {
    // Arrange
    const errorResult = streamOf(
      initMessage(),
      resultMessage({ is_error: true, subtype: "error_max_turns" })
    );
    const noInit = streamOf(resultMessage());

    // Act
    const first = await faultOf(
      spawnWith(() => ({ stdout: errorResult })).spawnClaude(REQUEST)
    );
    const second = await faultOf(
      spawnWith(() => ({ stdout: noInit })).spawnClaude(REQUEST)
    );

    // Assert
    expect(first).toContain("error result (error_max_turns)");
    expect(second).toContain("no recognizable init message");
  });
});
