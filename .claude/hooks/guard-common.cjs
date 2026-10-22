// Shared plumbing for the agent-guardrail hooks (never-auto-remediate,
// record-human-approval, plan-approval-guard, related-tests-stop).
//
// State lives OUTSIDE the repository, under `$TMPDIR/claude-guards/`, so a
// model editing the worktree cannot reset it with a file write it is allowed
// to make, and so a later shared implementation with the Deepgent repo can
// read the same files. Layout (identical in both repos):
//
//   $TMPDIR/claude-guards/<session_id>.json            Stop-hook block counter
//   $TMPDIR/claude-guards/approvals/<session_id>.json  human-approval receipt
//
// LIMIT: anything that can write these files can forge them. The guards stop
// an agent drifting past a gate by accident; they are not a sandbox.
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const guardDir = (env = process.env) =>
  path.join(env.TMPDIR || os.tmpdir(), "claude-guards");

// Session ids come from Claude Code, but they become a file name here; refuse
// anything that could climb out of the guard directory.
const safeSessionId = (id) =>
  typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id) ? id : null;

const readStdin = () => fs.readFileSync(0, "utf8");

const parseInput = (raw) => {
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
};

// A git hook exports GIT_DIR / GIT_INDEX_FILE; inherited, they would point
// every call at that repository instead of the one under `cwd`. Same pattern
// as scripts/check-coverage-floors-ratchet.mjs.
const gitEnv = (env = process.env) =>
  Object.fromEntries(
    Object.entries(env).filter(([key]) => !key.startsWith("GIT_"))
  );

const git = (cwd, args) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: gitEnv(),
    stdio: ["ignore", "pipe", "pipe"],
    // `git diff HEAD` over a lockfile bump passes the 1 MiB default.
    maxBuffer: 512 * 1024 * 1024,
  });

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

// Write-then-rename so a concurrent reader never sees a half-written file.
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, file);
};

const appendLog = (env, line) => {
  try {
    const dir = guardDir(env);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.appendFileSync(
      path.join(dir, "guards.log"),
      `${new Date().toISOString()} ${line}\n`
    );
  } catch {
    // Logging must never change a hook's verdict.
  }
};

module.exports = {
  appendLog,
  git,
  gitEnv,
  guardDir,
  parseInput,
  readJson,
  readStdin,
  safeSessionId,
  writeJson,
};
