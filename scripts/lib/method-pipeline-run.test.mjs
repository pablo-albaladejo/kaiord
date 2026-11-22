import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { cleanGitEnv } from "./clean-git-env.mjs";
import { pipelineEnv, repoGit } from "./method-pipeline-run.mjs";

describe("method-pipeline-run", () => {
  it("should drop every GIT_ and GREP variable and turn off user and system git config", () => {
    // Arrange
    const env = { PATH: "/bin", GIT_DIR: "/x", GREP_OPTIONS: "-r" };

    // Act
    const clean = pipelineEnv(env);

    // Assert
    assert.deepEqual(clean, {
      PATH: "/bin",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_TERMINAL_PROMPT: "0",
    });
  });

  it("should pipe each stage's output into the next without a shell", () => {
    // Arrange
    const repo = mkdtempSync(join(tmpdir(), "method-pipeline-run-"));
    const git = (...a) =>
      execFileSync(
        "git",
        [
          "-c",
          "user.name=T",
          "-c",
          "user.email=t@example.com",
          "-c",
          "commit.gpgsign=false",
          ...a,
        ],
        { cwd: repo, env: cleanGitEnv(), encoding: "utf8" }
      );
    git("init", "-q");
    writeFileSync(join(repo, "f"), "1");
    git("add", "f");
    git("commit", "-q", "-m", "one; touch PWNED");
    const sha = git("rev-parse", "HEAD").trim();

    // Act
    const answer = repoGit(repo).run([
      ["git", "log", sha, "--format=%s"],
      ["grep", "-c", "PWNED"],
    ]);
    const has = repoGit(repo).hasCommit(sha.slice(0, 9));
    rmSync(repo, { recursive: true, force: true });

    // Assert
    assert.equal(answer, "1");
    assert.equal(has, true);
  });
});
