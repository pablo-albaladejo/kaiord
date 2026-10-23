import { z } from "zod";

import { strayPlugins } from "./stray-plugins";

const count = z.array(z.unknown()).transform((items) => items.length);
const tokens = z.number().int().nonnegative();

/** Only the fields the harness reads; every other key is dropped. */
const initSchema = z
  .object({
    subtype: z.literal("init"),
    apiKeySource: z.string(),
    claude_code_version: z.string(),
    tools: count,
    mcp_servers: count,
    skills: count.optional(),
    plugins: z.array(z.unknown()).optional(),
  })
  .transform((m) => ({
    apiKeySource: m.apiKeySource,
    cliVersion: m.claude_code_version,
    tools: m.tools,
    mcpServers: m.mcp_servers,
    skills: m.skills ?? 0,
    strayPlugins: strayPlugins(m.plugins),
  }));

const numericFields = z
  .record(z.string(), z.unknown())
  .transform(
    (entry) =>
      Object.fromEntries(
        Object.entries(entry).filter(([, v]) => typeof v === "number")
      ) as Record<string, number>
  );

const resultSchema = z
  .object({
    subtype: z.string(),
    is_error: z.boolean(),
    structured_output: z.unknown().optional(),
    stop_reason: z.string().nullable().optional(),
    total_cost_usd: z.number().optional(),
    usage: z.object({
      input_tokens: tokens,
      output_tokens: tokens,
      cache_read_input_tokens: tokens.optional(),
      cache_creation_input_tokens: tokens.optional(),
    }),
    modelUsage: z.record(z.string(), numericFields),
  })
  .transform((m) => ({
    subtype: m.subtype,
    isError: m.is_error,
    structuredOutput: m.structured_output,
    stopReason: m.stop_reason ?? undefined,
    apiEquivalentCostUsd: m.total_cost_usd ?? 0,
    usage: {
      input: m.usage.input_tokens,
      output: m.usage.output_tokens,
      cacheRead: m.usage.cache_read_input_tokens ?? 0,
      cacheWrite: m.usage.cache_creation_input_tokens ?? 0,
    },
    modelUsage: m.modelUsage,
  }));

export type CliInit = z.output<typeof initSchema>;
export type CliResult = z.output<typeof resultSchema>;

/**
 * One `claude -p` call. `rateLimitInfos` stays raw because only the
 * rate-limit guard interprets it, and it is never written anywhere.
 */
export type CliRun = {
  init: CliInit;
  result: CliResult;
  rateLimitInfos: Array<unknown>;
};

type Parsed = { ok: true; run: CliRun } | { ok: false; fault: string };

const linesOf = (stdout: string): Array<Record<string, unknown>> =>
  stdout
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Record<string, unknown>);

/** The `stream-json` output: one init, one result, any rate-limit events. */
export const parseStream = (stdout: string): Parsed => {
  let messages: Array<Record<string, unknown>>;
  try {
    messages = linesOf(stdout);
  } catch {
    return { ok: false, fault: "the CLI printed a line that is not JSON" };
  }
  const init = messages.find(
    (m) => m.type === "system" && m.subtype === "init"
  );
  const result = messages.find((m) => m.type === "result");
  const parsedInit = initSchema.safeParse(init);
  if (!parsedInit.success)
    return { ok: false, fault: "no recognizable init message" };
  const parsedResult = resultSchema.safeParse(result);
  if (!parsedResult.success)
    return { ok: false, fault: "no recognizable result message" };
  const rateLimitInfos = messages
    .filter((m) => m.type === "rate_limit_event")
    .map((m) => m.rate_limit_info);
  return {
    ok: true,
    run: { init: parsedInit.data, result: parsedResult.data, rateLimitInfos },
  };
};

export const totalInputTokens = (result: CliResult): number =>
  result.usage.input + result.usage.cacheRead + result.usage.cacheWrite;
