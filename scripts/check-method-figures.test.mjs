import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  checkMethodFigures,
  NOTE,
  parseNote,
  repoGit,
} from "./check-method-figures.mjs";
import { cleanGitEnv } from "./lib/clean-git-env.mjs";
import { parsePipeline } from "./lib/method-pipeline.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let repo;

const git = (...args) =>
  execFileSync(
    "git",
    ["-c", "user.email=test@example.com", "-c", "commit.gpgsign=false"].concat(
      args
    ),
    { cwd: repo, encoding: "utf8", stdio: "pipe", env: cleanGitEnv() }
  );

const commit = (author, message) => {
  writeFileSync(join(repo, "file.txt"), message, "utf8");
  git("add", "-A");
  git("-c", `user.name=${author}`, "commit", "-q", "-m", message);
};

const TRAILERS =
  "--format='%(trailers:key=Co-authored-by,valueonly,separator=%x2C)'";

const note = (commitSha, rows) =>
  [
    "---",
    `figures_at: ${commitSha}`,
    "---",
    "",
    "# Method",
    "",
    "| Figure | Value | Command |",
    "| --- | --- | --- |",
    ...rows.map(
      ([f, v, c]) => `| ${f} | ${v} | \`${c.replace(/\|/g, "\\|")}\` |`
    ),
    "",
  ].join("\n");

let pinned;

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "check-method-figures-"));
  git("init", "-q", "-b", "main");
  commit(
    "Owner",
    "feat: one\n\nCo-authored-by: Claude Opus <noreply@example.com>"
  );
  commit("dependabot[bot]", "chore: bump");
  commit("Owner", "fix: two");
  pinned = git("rev-parse", "--short=9", "HEAD").trim();
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

const check = (markdown) =>
  checkMethodFigures({ note: markdown, git: repoGit(repo) });

describe("check-method-figures", () => {
  it("should pass when every figure equals its command's output at the pinned commit", () => {
    // Arrange
    const markdown = note(pinned, [
      ["Commits", "3", `git rev-list --count ${pinned}`],
      [
        "With an agent trailer",
        "1",
        `git log ${pinned} ${TRAILERS} | grep -c Claude`,
      ],
      [
        "By a bot",
        "1",
        `git log ${pinned} --format=%an | grep -c '\\[bot\\]$'`,
      ],
      [
        "By a bot, no trailer",
        "1",
        `git log ${pinned} --format='%an|%(trailers:key=Co-authored-by,valueonly,separator=%x2C)' | grep -v Claude | grep -c '\\[bot\\]|'`,
      ],
    ]);

    // Act
    const problems = check(markdown);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should name the figure whose number drifted from its command", () => {
    // Arrange
    const markdown = note(pinned, [
      ["Commits", "4", `git rev-list --count ${pinned}`],
    ]);

    // Act
    const problems = check(markdown);

    // Assert
    assert.deepEqual(problems, [
      `figure "Commits": the note says 4, \`git rev-list --count ${pinned}\` gives 3`,
    ]);
  });

  it("should keep a figure whose command counts zero matches", () => {
    // Arrange
    const markdown = note(pinned, [
      ["Nobody", "0", `git log ${pinned} --format=%an | grep -c Nobody`],
    ]);

    // Act
    const problems = check(markdown);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should fail with a fetch hint when the pinned commit is not in the clone", () => {
    // Arrange
    const markdown = note("0123456789ab", [
      ["Commits", "3", "git rev-list --count 0123456789ab"],
    ]);

    // Act
    const problems = check(markdown);

    // Assert
    assert.deepEqual(problems, [
      "commit 0123456789ab is not in this clone; the figures need full history (git fetch --unshallow)",
    ]);
  });

  it("should refuse a command that does not name the pinned commit", () => {
    // Arrange
    const markdown = note(pinned, [
      ["Commits", "3", "git rev-list --count HEAD"],
    ]);

    // Act
    const problems = check(markdown);

    // Assert
    assert.deepEqual(problems, [
      `figure "Commits": \`git rev-list --count HEAD\` does not name commit ${pinned}, so its answer would move with the history`,
    ]);
  });

  it("should refuse a command that is not a pipeline of git, grep and wc", () => {
    // Arrange
    const unsafe = [
      `git rev-list --count ${pinned}; touch pwned`,
      `git rev-list --count ${pinned} | sh`,
      `git log ${pinned} --format=$(id)`,
      `git rev-list --count ${pinned} > out`,
    ];
    const markdown = note(
      pinned,
      unsafe.map((c, i) => [`F${i}`, "3", c])
    );

    // Act
    const problems = check(markdown);

    // Assert
    assert.equal(problems.length, unsafe.length);
    assert.ok(
      problems.every((p) =>
        p.includes("is not an allowed pipeline of git, grep and wc")
      )
    );
  });

  it("should find only pinned git pipelines in the published note, without needing its history", () => {
    // Arrange
    const published = readFileSync(join(ROOT, NOTE), "utf8");
    const { rows } = parseNote(published);
    const key = (stages) => JSON.stringify(stages);
    const answers = new Map(
      rows.map((row) => [key(parsePipeline(row.command).stages), row.value])
    );
    const historyFree = {
      run: (stages) => answers.get(key(stages)) ?? null,
      hasCommit: () => true,
    };

    // Act
    const problems = checkMethodFigures({ note: published, git: historyFree });

    // Assert
    assert.ok(rows.length >= 10, `only ${rows.length} figure rows parsed`);
    assert.deepEqual(problems, []);
  });

  it("should run no attack a note could carry, and write no file", () => {
    // Arrange
    const marker = join(repo, "PWNED");
    const out = join(repo, "out.txt");
    const attacks = [
      `git -c alias.x='!touch ${marker}' x ${pinned} | wc -l`,
      `git log --output=${out} ${pinned} | wc -l`,
      `git log -o ${out} ${pinned} | wc -l`,
      `git -C / log ${pinned} | wc -l`,
      `git --git-dir=/tmp log ${pinned} | wc -l`,
      `git --work-tree=/ log ${pinned} | wc -l`,
      `git --config-env=core.pager=X log ${pinned} | wc -l`,
      `git x ${pinned} | wc -l`,
      `git log ${pinned} --upload-pack=touch | wc -l`,
      `git log ${pinned} --exec=touch | wc -l`,
      `git log ext::sh ${pinned} | wc -l`,
      `git log ${pinned} | grep -f /etc/passwd`,
      `git log ${pinned} | grep -r x .`,
      `git log ${pinned} | grep --include=x x`,
      `git log ${pinned} | grep x file.txt`,
      `git log ${pinned} -- ../outside | wc -l`,
      `git log ${pinned} -- /etc | wc -l`,
    ];
    const markdown = note(
      pinned,
      attacks.map((c, i) => [`A${i}`, "1", c])
    );

    // Act
    const problems = check(markdown);

    // Assert
    assert.equal(problems.length, attacks.length);
    assert.ok(problems.every((p) => p.includes("is not an allowed pipeline")));
    assert.equal(existsSync(marker), false);
    assert.equal(existsSync(out), false);
  });

  it("should fail when the note pins no commit or states no figure", () => {
    // Arrange
    const markdown = "# Method\n\nNo figures here.\n";

    // Act
    const problems = check(markdown);

    // Assert
    assert.deepEqual(problems, [
      "the note pins no commit (figures_at in its front matter)",
      "the note states no figure (| Figure | Value | `command` | rows)",
    ]);
  });
});
