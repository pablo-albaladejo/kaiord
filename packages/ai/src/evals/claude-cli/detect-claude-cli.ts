import { z } from "zod";
import { buildChildEnv } from "./child-env";
import type { Env } from "./child-env";
import { withEmptyCwd } from "./empty-cwd";
import { runProcess } from "./run-process";
import type { SpawnFn } from "./run-process";

export const CLAUDE_BINARY = "claude";
export const INERT_PREFIX = "INERT: claude CLI not available";

export type Detection =
  { available: true } | { available: false; reason: string };

/**
 * Read, never stored: only the three fields the decision needs survive the
 * parse, so the account's email and organization go nowhere.
 */
const authStatusSchema = z.object({
  loggedIn: z.boolean(),
  authMethod: z.string(),
  apiProvider: z.string().optional(),
});

/** A value the CLI reports, echoed only when it is a plain token. */
const token = (value: string | undefined): string =>
  value !== undefined && /^[A-Za-z0-9._-]{1,40}$/.test(value)
    ? value
    : "unrecognized";

const unavailable = (reason: string): Detection => ({
  available: false,
  reason,
});

const lockReason = (env: Env): string | undefined => {
  if (env.CI !== undefined) return "CI is set: the live lane never runs in CI";
  if (env.EVAL_LIVE !== "1") {
    return "EVAL_LIVE is not 1: only the eval:live package script opts in";
  }
  return undefined;
};

const judge = (stdout: string, code: number | null): Detection => {
  let raw: unknown;
  try {
    raw = JSON.parse(stdout);
  } catch {
    return unavailable(
      `claude auth status --json printed no JSON (exit ${code})`
    );
  }
  const parsed = authStatusSchema.safeParse(raw);
  if (!parsed.success)
    return unavailable("claude auth status --json has an unrecognized shape");
  const { loggedIn, authMethod, apiProvider } = parsed.data;
  if (!loggedIn) return unavailable("the CLI is not logged in");
  if (authMethod !== "claude.ai") {
    return unavailable(
      `auth method is ${token(authMethod)}, not the claude.ai subscription`
    );
  }
  if (apiProvider !== "firstParty") {
    return unavailable(
      `API provider is ${token(apiProvider)}, not first-party`
    );
  }
  return { available: true };
};

/**
 * Both locks before any process: `CI` set, or `EVAL_LIVE` other than `1`.
 * Then `claude auth status --json`, with the same allowlisted environment
 * and empty working directory as a model call.
 */
export const detectClaudeCli = async (deps: {
  env: Env;
  spawn: SpawnFn;
}): Promise<Detection> => {
  const locked = lockReason(deps.env);
  if (locked) return unavailable(locked);
  try {
    const out = await withEmptyCwd((cwd) =>
      runProcess(deps.spawn, CLAUDE_BINARY, ["auth", "status", "--json"], {
        cwd,
        env: buildChildEnv(deps.env),
        input: "",
      })
    );
    return judge(out.stdout, out.code);
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    return unavailable(
      code === "ENOENT"
        ? "the claude binary is not on PATH"
        : `claude auth status could not run (${token(String(code))})`
    );
  }
};

export const inertMessage = (reason: string): string =>
  `${INERT_PREFIX}: ${reason}`;
