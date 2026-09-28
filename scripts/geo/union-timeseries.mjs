#!/usr/bin/env node
// Merges the observatory data held on another ref (the rolling
// auto/seo-observatory branch, or an old weekly auto/seo-observatory-<run>
// branch) into the reports/seo/ working tree without losing a week.
//
//   node scripts/geo/union-timeseries.mjs --branch origin/auto/seo-observatory
//
// Every record is one measurement, identified by (date, source, provider):
//   - main wins: a record main already has (even a corrected one) is kept as
//     main has it, and the branch's copy of that key is dropped, so a line
//     fixed on main never comes back from the branch;
//   - the branch contributes only the keys main does not have (the weeks
//     collected since the rolling PR was opened);
//   - stable sort by the record's `date`, then by first appearance (main's
//     lines come before the branch's);
//   - a line that is not JSON has no key: it is kept verbatim (once), after
//     the dated lines, and reported (a ::warning:: in Actions);
//   - snapshots/*.json that exist only on the branch are copied in; a
//     snapshot already in the working tree is never overwritten.
// Whether to read the branch at all is decided by rolling-pr.mjs: a branch
// whose PR was closed unmerged is not restored.
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

const parse = (line) => {
  try {
    const record = JSON.parse(line);
    return record !== null && typeof record.date === "string" ? record : null;
  } catch {
    return null;
  }
};

const keyOf = (record) =>
  [record.date, record.source ?? "", record.provider ?? ""].join("\u0000");

export function unionLines(mainLines, branchLines) {
  const mainKeys = new Set();
  for (const line of mainLines) {
    const record = parse(line);
    if (record !== null) mainKeys.add(keyOf(record));
  }
  const seenLines = new Set();
  const seenBranchKeys = new Set();
  const dated = [];
  const malformed = [];
  const take = (line, fromBranch) => {
    if (seenLines.has(line)) return;
    const record = parse(line);
    if (record === null) {
      seenLines.add(line);
      malformed.push(line);
      return;
    }
    const key = keyOf(record);
    if (fromBranch && (mainKeys.has(key) || seenBranchKeys.has(key))) return;
    if (fromBranch) seenBranchKeys.add(key);
    seenLines.add(line);
    dated.push({ line, date: record.date });
  };
  for (const line of mainLines) take(line, false);
  for (const line of branchLines) take(line, true);
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
