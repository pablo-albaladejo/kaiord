export type Env = Readonly<Record<string, string | undefined>>;

/**
 * The only parent variables the child sees: enough to find the binary and
 * its own claude.ai login. An allowlist, not a denylist, so
 * `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, any
 * `CLAUDE_*` and any variable a future CLI reads never reach it.
 */
export const CHILD_ENV_ALLOWLIST = [
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "SHELL",
  "LANG",
  "TMPDIR",
] as const;

export const buildChildEnv = (parent: Env): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const name of CHILD_ENV_ALLOWLIST) {
    const value = parent[name];
    if (value !== undefined) env[name] = value;
  }
  // Production does not enable reasoning, so neither does a live call.
  env.MAX_THINKING_TOKENS = "0";
  return env;
};
