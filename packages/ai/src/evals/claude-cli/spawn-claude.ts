import { buildChildEnv } from "./child-env";
import type { Env } from "./child-env";
import { claudeArgs } from "./clean-context-args";
import type { ClaudeRequest } from "./clean-context-args";
import { CLAUDE_BINARY } from "./detect-claude-cli";
import { withEmptyCwd } from "./empty-cwd";
import { harnessFault } from "./harness-fault";
import { runProcess } from "./run-process";
import type { SpawnFn } from "./run-process";
import { parseStream } from "./stream-messages";
import type { CliInit, CliRun } from "./stream-messages";

export type SpawnClaude = (request: ClaudeRequest) => Promise<CliRun>;

/**
 * Isolation checked by its effect on every call: a stray key would bill the
 * API silently, and an MCP server, skill or tool means the flags leaked.
 */
export const initFault = (init: CliInit): string | undefined => {
  if (init.apiKeySource !== "none") {
    return "the CLI reports an API key source other than none: a stray key would bill the API";
  }
  const leaked = (["mcpServers", "skills", "plugins", "tools"] as const)
    .filter((key) => init[key] > 0)
    .map((key) => `${init[key]} ${key}`);
  return leaked.length === 0
    ? undefined
    : `the clean context leaked: ${leaked.join(", ")}`;
};

/** One `claude -p` process per call; any doubt aborts as a harness fault. */
export const createSpawnClaude =
  (deps: { env: Env; spawn: SpawnFn; timeoutMs?: number }): SpawnClaude =>
  (request) =>
    withEmptyCwd(async (cwd) => {
      const out = await runProcess(
        deps.spawn,
        CLAUDE_BINARY,
        claudeArgs(request),
        {
          cwd,
          env: buildChildEnv(deps.env),
          input: request.prompt,
          timeoutMs: deps.timeoutMs,
        }
      );
      const parsed = parseStream(out.stdout);
      if (!parsed.ok) throw harnessFault(`${parsed.fault} (exit ${out.code})`);
      const fault = initFault(parsed.run.init);
      if (fault) throw harnessFault(fault);
      if (parsed.run.result.isError) {
        throw harnessFault(
          `the CLI returned an error result (${parsed.run.result.subtype})`
        );
      }
      // A parsed stream does not excuse a failed process.
      if (out.code !== 0)
        throw harnessFault(`the CLI exited with code ${out.code}`);
      return parsed.run;
    });
