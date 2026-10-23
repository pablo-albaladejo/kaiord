import { EventEmitter } from "node:events";
import { existsSync, readdirSync } from "node:fs";
import type {
  ChildLike,
  SpawnFn,
  SpawnOptions,
} from "../evals/claude-cli/run-process";
import type { CliRun } from "../evals/claude-cli/stream-messages";

export type SpawnCall = {
  command: string;
  args: Array<string>;
  options: SpawnOptions;
  /** The cwd's entries while the child ran; it must exist and be empty. */
  cwdEntries: Array<string>;
  stdin: string;
};

export type SpawnReply = {
  stdout?: string;
  /** Raw stdout chunks, emitted in order in place of `stdout`. */
  chunks?: Array<Buffer>;
  code?: number;
  error?: Error & { code?: string };
  /** Never closes: the child hangs until it is killed. */
  hang?: true;
  /** Its stdin fails as a pipe closed by an exited child would. */
  stdinError?: Error;
};

/**
 * A `spawn` double: no test starts a process. Each call is answered by
 * `reply`, asynchronously, the way a real child closes after writing.
 */
export const createSpawnDouble = (reply: (call: SpawnCall) => SpawnReply) => {
  const calls: Array<SpawnCall> = [];
  const killed: Array<string> = [];
  const spawn: SpawnFn = (command, args, options) => {
    const child = new EventEmitter() as EventEmitter & ChildLike;
    const stdout = new EventEmitter();
    const call: SpawnCall = {
      command,
      args,
      options,
      cwdEntries: existsSync(options.cwd)
        ? readdirSync(options.cwd)
        : ["<missing>"],
      stdin: "",
    };
    calls.push(call);
    const stdin = Object.assign(new EventEmitter(), {
      end: (chunk: string) => (call.stdin = chunk),
    });
    Object.assign(child, {
      stdout,
      stderr: new EventEmitter(),
      stdin,
      kill: (signal: string) => killed.push(signal),
    });
    setImmediate(() => {
      const out = reply(call);
      if (out.stdinError) stdin.emit("error", out.stdinError);
      if (out.hang || out.stdinError) return;
      if (out.error) {
        child.emit("error", out.error);
        return;
      }
      for (const chunk of out.chunks ?? [out.stdout ?? ""]) {
        stdout.emit("data", chunk);
      }
      child.emit("close", out.code ?? 0);
    });
    return child;
  };
  return { spawn, calls, killed };
};

export const initMessage = (overrides: Record<string, unknown> = {}) => ({
  type: "system",
  subtype: "init",
  cwd: "/private/tmp/kaiord-eval-x",
  session_id: "00000000-0000-0000-0000-000000000000",
  apiKeySource: "none",
  claude_code_version: "2.1.308",
  tools: [],
  mcp_servers: [],
  // What the real CLI reports under the clean-context flags (2026-10-23).
  plugins: ["agents-md", "telemetry", "plugin-authoring"].map((short) => ({
    name: `cc-plugin-${short}`,
    path: "builtin",
    source: `cc-plugin-${short}@builtin`,
  })),
  model: "claude-sonnet-5",
  ...overrides,
});

export const resultMessage = (overrides: Record<string, unknown> = {}) => ({
  type: "result",
  subtype: "success",
  is_error: false,
  structured_output: { ok: true },
  stop_reason: "end_turn",
  total_cost_usd: 0.01,
  usage: { input_tokens: 600, output_tokens: 20, cache_read_input_tokens: 70 },
  modelUsage: { "claude-sonnet-5": { inputTokens: 600, costUSD: 0.01 } },
  uuid: "11111111-1111-1111-1111-111111111111",
  session_id: "00000000-0000-0000-0000-000000000000",
  ...overrides,
});

export const rateLimitEvent = (info: Record<string, unknown>) => ({
  type: "rate_limit_event",
  rate_limit_info: info,
  uuid: "22222222-2222-2222-2222-222222222222",
  session_id: "00000000-0000-0000-0000-000000000000",
});

export const streamOf = (...messages: Array<unknown>): string =>
  messages.map((m) => JSON.stringify(m)).join("\n") + "\n";

/** A parsed run, as `parseStream` returns it. */
export const cliRun = (
  overrides: Partial<CliRun["result"]> = {},
  rateLimitInfos: Array<unknown> = []
): CliRun => ({
  init: {
    apiKeySource: "none",
    cliVersion: "2.1.308",
    tools: 0,
    mcpServers: 0,
    skills: 0,
    strayPlugins: [],
  },
  result: {
    subtype: "success",
    isError: false,
    structuredOutput: { ok: true },
    stopReason: "end_turn",
    apiEquivalentCostUsd: 0.01,
    usage: { input: 600, output: 20, cacheRead: 70, cacheWrite: 0 },
    modelUsage: { "claude-sonnet-5": { inputTokens: 600 } },
    ...overrides,
  },
  rateLimitInfos,
});
