#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { failIfAny } from "./lib/guard-failure.mjs";
import { parsePipeline } from "./lib/method-pipeline.mjs";
import { repoGit } from "./lib/method-pipeline-run.mjs";

export { repoGit } from "./lib/method-pipeline-run.mjs";

// Every figure on the method note is a table row `| figure | value | `cmd` |`.
// Each command names the commit pinned in the note's front matter, so its
// answer is fixed: the guard reruns it and the note must state that answer
// exactly (tolerance 0). New commits never move a figure; a rewritten
// history that drops the pinned commit fails until the note is recomputed.
// No shell runs: each stage is spawned with its own argv and the pipe is
// done here, after `parsePipeline` has allowed every word of it.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const NOTE = "packages/docs/project/how-kaiord-is-built.md";

const PINNED =
  /^---\n[\s\S]*?^figures_at:\s*([0-9a-f]{7,40})\s*$[\s\S]*?^---$/m;
const ROW = /^\|(.+?)\|\s*(\d+)\s*\|\s*`(.+)`\s*\|\s*$/;

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

const rowProblem = ({ figure, value, command }, commit, git) => {
  const where = `figure "${figure}"`;
  const pipeline = parsePipeline(command);
  if (pipeline.error)
    return `${where}: \`${command}\` is not an allowed pipeline of git, grep and wc: it has ${pipeline.error}`;
  if (pipeline.revision !== commit)
    return `${where}: \`${command}\` does not name commit ${commit}, so its answer would move with the history`;
  const answer = git.run(pipeline.stages);
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const note = readFileSync(join(ROOT, NOTE), "utf8");
  failIfAny(
    "method-note figure problem(s)",
    checkMethodFigures({ note, git: repoGit(ROOT) }),
    `Rerun each command in ${NOTE} and state its answer; see the note's "Check it yourself".`
  );
  console.log("✅ Every figure on the method note matches its command");
}
