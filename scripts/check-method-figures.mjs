#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { gitEnv } from "./check-coverage-floors-ratchet.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

// Every figure on the method note is a table row `| figure | value | `cmd` |`.
// Each command names the commit pinned in the note's front matter, so its
// answer is fixed: the guard reruns it and the note must state that answer
// exactly (tolerance 0). New commits never move a figure; a rewritten
// history that drops the pinned commit fails until the note is recomputed.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const NOTE = "packages/docs/project/how-kaiord-is-built.md";

const PINNED =
  /^---\n[\s\S]*?^figures_at:\s*([0-9a-f]{7,40})\s*$[\s\S]*?^---$/m;
const ROW = /^\|(.+?)\|\s*(\d+)\s*\|\s*`(.+)`\s*\|\s*$/;
const SEGMENT = /^(git|grep|wc)\s/;
const FORBIDDEN = /[;&<>`"\\\n]|\$[({]/;

export const parseNote = (note) => ({
  commit: PINNED.exec(note)?.[1] ?? null,
  rows: note
    .split("\n")
    .map((line) => ROW.exec(line.trim()))
    .filter(Boolean)
    .map(([, figure, value, command]) => ({
      figure: figure.trim(),
      value,
      command: command.replace(/\\\|/g, "|"),
    })),
});

// Pipes inside single quotes are part of an argument, not a new command.
const segments = (command) =>
  command
    .split("'")
    .map((part, i) => (i % 2 === 0 ? part : part.replace(/\|/g, "")))
    .join("'")
    .split("|");

// Single-quoted text is literal to sh, so only what sits outside the quotes
// can start a command, redirect or expand.
const unquoted = (command) =>
  command
    .split("'")
    .filter((_, i) => i % 2 === 0)
    .join(" ");

const isPipeline = (command) =>
  (command.match(/'/g) ?? []).length % 2 === 0 &&
  !FORBIDDEN.test(unquoted(command)) &&
  segments(command).every((segment) => SEGMENT.test(segment.trim()));

const rowProblem = ({ figure, value, command }, commit, git) => {
  const where = `figure "${figure}"`;
  if (!isPipeline(command))
    return `${where}: \`${command}\` is not a pipeline of git, grep and wc`;
  if (!command.includes(commit))
    return `${where}: \`${command}\` does not name commit ${commit}, so its answer would move with the history`;
  const answer = git.run(command);
  if (answer === null) return `${where}: \`${command}\` printed nothing`;
  return answer === value
    ? null
    : `${where}: the note says ${value}, \`${command}\` gives ${answer}`;
};

export function checkMethodFigures({ note, git }) {
  const { commit, rows } = parseNote(note);
  const problems = [];
  if (!commit)
    problems.push("the note pins no commit (figures_at in its front matter)");
  if (rows.length === 0)
    problems.push(
      "the note states no figure (| Figure | Value | `command` | rows)"
    );
  if (problems.length > 0) return problems;
  if (!git.hasCommit(commit))
    return [
      `commit ${commit} is not in this clone; the figures need full history (git fetch --unshallow)`,
    ];
  return rows.map((row) => rowProblem(row, commit, git)).filter(Boolean);
}

const shell = (root, command) =>
  spawnSync("sh", ["-c", command], {
    cwd: root,
    encoding: "utf8",
    env: gitEnv(),
  });

// `grep -c` exits 1 when it counts zero, so the answer is the output, not
// the exit code; a command that prints nothing has failed.
export const repoGit = (root) => ({
  run: (command) => shell(root, command).stdout.trim() || null,
  hasCommit: (sha) =>
    shell(root, `git cat-file -e ${sha}^{commit}`).status === 0,
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const note = readFileSync(join(ROOT, NOTE), "utf8");
  failIfAny(
    "method-note figure problem(s)",
    checkMethodFigures({ note, git: repoGit(ROOT) }),
    `Rerun each command in ${NOTE} and state its answer; see the note's "Check it yourself".`
  );
  console.log("✅ Every figure on the method note matches its command");
}
