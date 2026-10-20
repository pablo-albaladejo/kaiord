// A git hook exports GIT_DIR / GIT_INDEX_FILE (and friends). A child process
// that inherits them runs against the hook's repository instead of its own
// `cwd`: a test's `git init` then rewrites the shared .git/config (core.bare).
// Tests that spawn git, or a script that spawns git, pass this as `env`.

export const cleanGitEnv = (env = process.env) =>
  Object.fromEntries(
    Object.entries(env).filter(([key]) => !key.startsWith("GIT_"))
  );
