import { spawn as nodeSpawn } from "node:child_process";
import type { Env } from "./child-env";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { detectClaudeCli, inertMessage } from "./detect-claude-cli";
import type { LanguageModelV4 } from "./language-model-types";
import {
  readCallTimeoutMs,
  readMaxCalls,
  readMaxWeekly,
  readModelId,
} from "./live-config";
import { createLiveSession } from "./live-session";
import { managedSettingsPaths } from "./managed-settings";
import type { LiveSession } from "./live-session";
import { SEVEN_DAY_FIELD } from "./rate-limit-guard";
import type { WeeklyField } from "./rate-limit-guard";
import type { SpawnFn } from "./run-process";
import { createSpawnClaude } from "./spawn-claude";

export type LiveModel = {
  model: LanguageModelV4;
  modelId: string;
  provider: "anthropic";
  session: LiveSession;
  /** Managed-settings paths found by existence, never read. */
  managedSettings: Array<string>;
};

export type LoadLiveDeps = {
  env?: Env;
  spawn?: SpawnFn;
  field?: WeeklyField | null;
  managedSettings?: () => Array<string>;
};

/**
 * The only live model access: the maintainer's local Claude Code
 * subscription. Detection runs first and throws an `INERT: claude CLI not
 * available` message before any model call; every call then goes through one
 * session holding the budget and the rate-limit guard.
 */
export const loadLiveModel = async (
  deps: LoadLiveDeps = {}
): Promise<LiveModel> => {
  const env = deps.env ?? process.env;
  const spawn = deps.spawn ?? (nodeSpawn as unknown as SpawnFn);
  const detection = await detectClaudeCli({ env, spawn });
  if (!detection.available) throw new Error(inertMessage(detection.reason));
  const modelId = readModelId(env);
  const session = createLiveSession({
    spawnClaude: createSpawnClaude({
      env,
      spawn,
      timeoutMs: readCallTimeoutMs(env),
    }),
    maxCalls: readMaxCalls(env),
    maxWeekly: readMaxWeekly(env),
    field: deps.field === undefined ? SEVEN_DAY_FIELD : deps.field,
  });
  const model = createClaudeCliLanguageModel({ modelId, call: session.call });
  return {
    model,
    modelId,
    provider: "anthropic",
    session,
    managedSettings: (deps.managedSettings ?? managedSettingsPaths)(),
  };
};
