import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { cleanGitEnv } from "./clean-git-env.mjs";

// Fixture git calls must never inherit a hook's GIT_DIR / GIT_INDEX_FILE: under
// pre-commit they name the committing worktree, so an inherited env would
// init, commit and add worktrees in the real repo. Only the control below
// passes a hook-style env, and it builds that env from a clean base.
const git = (args, options = {}) =>
  execFileSync("git", args, {
    encoding: "utf8",
    ...options,
    env: options.env ?? cleanGitEnv(process.env),
  }).trim();

test("cleanGitEnv drops every GIT_* variable and keeps the rest", () => {
  const env = cleanGitEnv({
    GIT_DIR: "/x",
    GIT_INDEX_FILE: "/y",
    GIT_WORK_TREE: "/z",
    PATH: "/bin",
  });
  assert.deepEqual(env, { PATH: "/bin" });
});

// Mirrors a pre-commit hook inside a linked worktree: GIT_DIR names the
// worktree's git dir, whose config is the one shared with the main checkout.
test("a git init under a hook-style GIT_DIR leaves the shared config alone", () => {
  const base = mkdtempSync(join(tmpdir(), "clean-git-env-"));
  try {
    const main = join(base, "main");
    const linkedGitDir = join(main, ".git", "worktrees", "wt");
    const ident = ["-c", "user.name=t", "-c", "user.email=t@t"];
    git(["init", "-q", main]);
    git([...ident, "-C", main, "commit", "-q", "--allow-empty", "-m", "x"]);
    git(["-C", main, "worktree", "add", "-q", join(base, "wt"), "-b", "f"]);
    const hookEnv = { ...cleanGitEnv(process.env), GIT_DIR: linkedGitDir };
    const sandbox = mkdtempSync(join(base, "sandbox-"));
    const bare = () => git(["-C", main, "config", "core.bare"]);
    assert.equal(bare(), "false");

    // Control: the inherited env is what flips it, so this test can fail.
    git(["init", "-q"], { cwd: sandbox, env: hookEnv });
    assert.equal(bare(), "true", "control: leak must reproduce");
    git(["-C", main, "config", "core.bare", "false"]);

    git(["init", "-q"], { cwd: sandbox, env: cleanGitEnv(hookEnv) });
    assert.equal(bare(), "false");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
