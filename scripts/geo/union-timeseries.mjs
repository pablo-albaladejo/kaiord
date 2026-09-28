#!/usr/bin/env node
// Merges the observatory data held on another ref (the rolling
// auto/seo-observatory branch, or an old weekly auto/seo-observatory-<run>
// branch) into the reports/seo/ working tree without losing a week.
//
//   node scripts/geo/union-timeseries.mjs --branch origin/auto/seo-observatory
//
// timeseries/*.jsonl are append-only, and every unmerged branch holds a
// different week, so neither side can simply win:
//   - union of both files: a line only on the working tree (main) survives,
//     a line only on the branch survives, an identical line is kept once;
//   - stable sort by the record's `date`, then by first appearance (the
//     working tree's lines come before the branch's);
//   - a line that is not JSON is kept verbatim, after the dated lines, and
//     reported (a ::warning:: in Actions) so it gets fixed by hand;
//   - snapshots/*.json that exist only on the branch are copied in; a
//     snapshot already in the working tree is never overwritten.
// A ref with no timeseries file at all is an error, not a no-op: that is a
// wrong ref, and silently merging nothing would lose the data it was meant
// to carry.
//
// Node stdlib only, like the collectors (the workflow runs without install).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TIMESERIES = "reports/seo/timeseries";
const SNAPSHOTS = "reports/seo/snapshots";

const splitLines = (text) =>
  text.split("\n").filter((line) => line.trim() !== "");

const dateOf = (line) => {
  try {
    const record = JSON.parse(line);
    return record !== null && typeof record.date === "string"
      ? record.date
      : null;
  } catch {
    return null;
  }
};

export function unionLines(mainLines, branchLines) {
  const seen = new Set();
  const ordered = [];
  for (const line of [...mainLines, ...branchLines]) {
    if (seen.has(line)) continue;
    seen.add(line);
    ordered.push(line);
  }
  const dated = [];
  const malformed = [];
  for (const line of ordered) {
    const date = dateOf(line);
    if (date === null) malformed.push(line);
    else dated.push({ line, date });
  }
  // Array.prototype.sort is stable, so equal dates keep first appearance.
  dated.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return { lines: [...dated.map((d) => d.line), ...malformed], malformed };
}

const defaultGit = (args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// Applies `ref`'s observatory data onto the working tree at `root`.
// `git(args)` returns stdout (injected by the tests).
export function applyBranch({ ref, root, git = defaultGit, log = console }) {
  const list = (dir) =>
    splitLines(git(["ls-tree", "-r", "--name-only", ref, "--", `${dir}/`]));
  const show = (path) => git(["show", `${ref}:${path}`]);

  const seriesPaths = list(TIMESERIES).filter((p) => p.endsWith(".jsonl"));
  if (seriesPaths.length === 0) {
    throw new Error(`${ref} has no ${TIMESERIES}/*.jsonl — wrong ref?`);
  }

  const report = { ref, series: [], snapshotsCopied: [], malformed: [] };
  for (const path of seriesPaths) {
    const target = join(root, path);
    const mainLines = existsSync(target)
      ? splitLines(readFileSync(target, "utf8"))
      : [];
    const { lines, malformed } = unionLines(mainLines, splitLines(show(path)));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${lines.join("\n")}\n`);
    report.series.push({ path, before: mainLines.length, after: lines.length });
    for (const line of malformed) report.malformed.push({ path, line });
  }

  for (const path of list(SNAPSHOTS)) {
    const target = join(root, path);
    if (existsSync(target)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, show(path));
    report.snapshotsCopied.push(path);
  }

  for (const { path, line } of report.malformed) {
    log.warn(
      `::warning file=${path}::union-timeseries kept a line that is not JSON: ${line.slice(0, 120)}`
    );
  }
  return report;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const at = process.argv.indexOf("--branch");
  const ref = at === -1 ? undefined : process.argv[at + 1];
  if (!ref) {
    console.error("usage: union-timeseries.mjs --branch <ref>");
    process.exit(2);
  }
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const report = applyBranch({ ref, root });
    for (const s of report.series) {
      console.log(`[union] ${s.path}: ${s.before} -> ${s.after} lines`);
    }
    console.log(
      `[union] ${ref}: ${report.snapshotsCopied.length} snapshot(s) copied`
    );
  } catch (error) {
    console.error(`::error::union-timeseries: ${error.message}`);
    process.exit(1);
  }
}
