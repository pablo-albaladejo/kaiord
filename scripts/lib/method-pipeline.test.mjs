import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { parsePipeline } from "./method-pipeline.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SHA = "b9b38f824";

const ATTACKS = {
  "a git alias": `git -c alias.x='!echo PWNED' x ${SHA} | wc -l`,
  "a git log --output": `git log --output=/tmp/x ${SHA} | wc -l`,
  "a git log -o": `git log -o /tmp/x ${SHA} | wc -l`,
  "an --exec": `git log ${SHA} --exec=sh | wc -l`,
  "an --upload-pack": `git log ${SHA} --upload-pack=sh | wc -l`,
  "a --git-dir": `git --git-dir=/tmp log ${SHA} | wc -l`,
  "a --work-tree": `git --work-tree=/ log ${SHA} | wc -l`,
  "a -C": `git -C / log ${SHA} | wc -l`,
  "a --config-env": `git --config-env=core.pager=X log ${SHA} | wc -l`,
  "an unknown subcommand": `git x ${SHA} | wc -l`,
  "an ext:: transport": `git log ext::sh ${SHA} | wc -l`,
  "an option not in the list": `git log --stat ${SHA} | wc -l`,
  "grep -f": `git log ${SHA} | grep -f /etc/passwd`,
  "grep -r": `git log ${SHA} | grep -r x`,
  "grep --include": `git log ${SHA} | grep --include=x x`,
  "a grep file operand": `git log ${SHA} | grep x /etc/passwd`,
  "a path outside the repo": `git log ${SHA} -- ../x | wc -l`,
  "an absolute path": `git ls-tree ${SHA} /etc | wc -l`,
  "a wc file operand": `git log ${SHA} | wc -l /etc/passwd`,
  "a stage that is not grep or wc": `git log ${SHA} | sh`,
  "a first stage that is not git": `sh -c id | wc -l`,
  "two revisions": `git log ${SHA} HEAD | wc -l`,
};

describe("method-pipeline", () => {
  for (const [name, command] of Object.entries(ATTACKS)) {
    it(`should refuse ${name}`, () => {
      // Arrange
      const input = command;

      // Act
      const { error, stages } = parsePipeline(input);

      // Assert
      assert.equal(typeof error, "string");
      assert.equal(stages, undefined);
    });
  }

  it("should refuse every option that counts changed lines, so a figure stays a commit count", () => {
    // Arrange
    const options = ["--stat", "--numstat", "--shortstat", "-p", "--patch"];

    // Act
    const errors = options.map(
      (o) => parsePipeline(`git log ${o} ${SHA} | wc -l`).error
    );

    // Assert
    assert.ok(errors.every((e) => typeof e === "string"));
  });

  it("should allow every command of the published method note, naming its revision", () => {
    // Arrange
    const note = readFileSync(
      join(ROOT, "packages/docs/project/how-kaiord-is-built.md"),
      "utf8"
    );
    const commands = [
      ...note.matchAll(/^\|.+\|\s*\d+\s*\|\s*`(.+)`\s*\|$/gm),
    ].map((m) => m[1].replace(/\\\|/g, "|"));

    // Act
    const parsed = commands.map(parsePipeline);

    // Assert
    assert.equal(commands.length, 18);
    assert.deepEqual(
      parsed.filter((p) => p.error),
      []
    );
    assert.ok(parsed.every((p) => p.revision === SHA));
  });
});
