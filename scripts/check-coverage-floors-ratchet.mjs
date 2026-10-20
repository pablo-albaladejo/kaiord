#!/usr/bin/env node
/**
 * Mechanical guard: a coverage floor may rise, never fall
 * (R-CoverageFloorsRatchet).
 *
 * Every floor is a literal: the per-package THRESHOLD arms in ci.yml, the
 * `thresholds` blocks in packages' vitest configs, codecov.yml status targets
 * and the default of .github/scripts/check-coverage.js. Lowering any of them
 * is a one-line diff that every other gate accepts, so this guard compares
 * each floor with its value at the merge base and fails when one is lowered
 * or removed. Raising or adding a floor passes.
 *
 * Direction matters for one kind. A codecov `threshold` is the drop it
 * TOLERATES, so for it raising is the relaxation.
 *
 * The ci.yml arms are resolved per package: a bridge moved out of the 60 arm
 * falls to the default arm and is compared at that value. The arms only count
 * while the check-coverage.js call passes `$THRESHOLD`; a hard-coded argument
 * would bypass them, so it reads as every ci.yml floor removed.
 *
 * Fails closed: an unresolvable base ref, or zero floors found on both sides
 * (a broken extraction, not a clean tree), is a violation.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 * Env:
 *   COVERAGE_FLOORS_BASE_REF   Ref whose merge base is the baseline
 *                              (default origin/main).
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const CI = ".github/workflows/ci.yml";
const CHECKER = ".github/scripts/check-coverage.js";
const CODECOV = "codecov.yml";
const VITEST_CONFIG = /^vitest(?:\.[\w-]+)?\.config\.(?:ts|mts|js|mjs)$/;
const CI_ARM = /^\s*([\w|*-]+)\)\s*THRESHOLD=(\d+(?:\.\d+)?)\s*;;/gm;
const CI_CALL = /check-coverage\.js\s.*\s"?\$\{?THRESHOLD\}?"?\s*$/m;
const CHECKER_DEFAULT = /process\.argv\[3\]\s*\|\|\s*["'](\d+(?:\.\d+)?)["']/;
const THRESHOLDS = /\bthresholds\s*:\s*\{([^}]*)\}/;
const THRESHOLD_ENTRY = /["']?(\w+)["']?\s*:\s*(-?\d+(?:\.\d+)?)/g;

const floor = (value) => ({ value, loosensWhen: "lower" });
const tolerance = (value) => ({ value, loosensWhen: "higher" });

export const ciArms = (text) => {
  if (!CI_CALL.test(text)) return {};
  const arms = {};
  for (const [, names, value] of text.matchAll(CI_ARM)) {
    for (const name of names.split("|")) arms[name] = Number(value);
  }
  return arms;
};

export const ciFloors = (arms, names) => {
  const floors = {};
  for (const name of names) {
    const value = arms[name] ?? arms["*"];
    if (value !== undefined) floors[`${CI} arm ${name}`] = floor(value);
  }
  return floors;
};

export const checkerFloors = (text) => {
  const match = text.match(CHECKER_DEFAULT);
  return match ? { [`${CHECKER} default`]: floor(Number(match[1])) } : {};
};

export const vitestFloors = (text, file) => {
  const block = text.match(THRESHOLDS);
  if (!block) return {};
  const floors = {};
  for (const [, metric, value] of block[1].matchAll(THRESHOLD_ENTRY)) {
    floors[`${file} thresholds.${metric}`] = floor(Number(value));
  }
  return floors;
};

const percent = (raw) => {
  const value = Number.parseFloat(String(raw ?? "").replace("%", ""));
  return Number.isFinite(value) ? value : undefined;
};

export const codecovFloors = (text) => {
  const floors = {};
  const status = parseYaml(text)?.coverage?.status ?? {};
  for (const kind of ["project", "patch"]) {
    for (const [name, check] of Object.entries(status[kind] ?? {})) {
      if (!check || check.informational === true) continue;
      const key = `${CODECOV} status.${kind}.${name}`;
      const target = percent(check.target);
      const slack = percent(check.threshold);
      if (target !== undefined) floors[`${key}.target`] = floor(target);
      if (slack !== undefined) floors[`${key}.threshold`] = tolerance(slack);
    }
  }
  return floors;
};

export const compareFloors = (base, head) => {
  const violations = [];
  for (const [key, was] of Object.entries(base)) {
    const now = head[key];
    if (!now) {
      violations.push({ kind: "removed", key, detail: `was ${was.value}` });
      continue;
    }
    const looser =
      was.loosensWhen === "lower"
        ? now.value < was.value
        : now.value > was.value;
    if (looser) {
      violations.push({
        kind: was.loosensWhen === "lower" ? "lowered" : "loosened",
        key,
        detail: `${was.value} -> ${now.value}`,
      });
    }
  }
  return violations;
};

const vitestConfigs = (paths) =>
  paths.filter((p) => {
    const parts = p.split("/");
    return (
      parts.length === 3 &&
      parts[0] === "packages" &&
      VITEST_CONFIG.test(parts[2])
    );
  });

const safeRead = (read, path) => {
  try {
    return read(path) ?? "";
  } catch {
    return "";
  }
};

const collect = ({ read, files, ciNames }) => {
  const safe = (path) => safeRead(read, path);
  const floors = {
    ...ciFloors(ciArms(safe(CI)), ciNames),
    ...checkerFloors(safe(CHECKER)),
    ...codecovFloors(safe(CODECOV)),
  };
  for (const file of files)
    Object.assign(floors, vitestFloors(safe(file), file));
  return floors;
};

// A git hook exports GIT_DIR / GIT_INDEX_FILE; inherited, they would point
// every call at the hook's repository instead of `root`.
export const gitEnv = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"))
  );

const defaultGit = (root) => (args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: gitEnv(),
    stdio: ["ignore", "pipe", "pipe"],
  });

const headPaths = (root) => {
  let packages;
  try {
    packages = readdirSync(join(root, "packages"));
  } catch {
    return [];
  }
  return packages.flatMap((pkg) => {
    try {
      return readdirSync(join(root, "packages", pkg)).map(
        (f) => `packages/${pkg}/${f}`
      );
    } catch {
      return [];
    }
  });
};

export const runCheck = ({ root, baseRef, git = defaultGit(root) }) => {
  let base;
  try {
    base = git(["merge-base", "HEAD", baseRef]).trim();
  } catch (error) {
    const reason = String(error.stderr || error.message)
      .trim()
      .split("\n")[0];
    return [
      {
        kind: "base-unavailable",
        key: baseRef,
        detail:
          `cannot resolve the merge base with ${baseRef} (${reason}). ` +
          `Fetch it (git fetch origin main) or check out with fetch-depth: 0; ` +
          `without a baseline no floor can be compared, so this fails closed.`,
      },
    ];
  }

  const readBase = (path) => git(["show", `${base}:${path}`]);
  const readHead = (path) => readFileSync(join(root, path), "utf8");
  const baseFiles = vitestConfigs(
    git(["ls-tree", "-r", "--name-only", base, "packages"]).split("\n")
  );
  const headFiles = vitestConfigs(headPaths(root));
  const files = [...new Set([...baseFiles, ...headFiles])];
  const ciNames = [
    ...new Set([
      ...Object.keys(ciArms(safeRead(readBase, CI))),
      ...Object.keys(ciArms(safeRead(readHead, CI))),
    ]),
  ];

  const baseFloors = collect({ read: readBase, files: baseFiles, ciNames });
  const headFloors = collect({ read: readHead, files, ciNames });
  const keys = [...Object.keys(baseFloors), ...Object.keys(headFloors)];
  const empty = [CI, CHECKER, CODECOV, "vitest"].filter(
    (source) => !keys.some((key) => key.includes(source))
  );
  if (empty.length > 0) {
    return empty.map((source) => ({
      kind: "scan-empty",
      key: source,
      detail: "no floor found on either side — the extraction is broken",
    }));
  }
  return compareFloors(baseFloors, headFloors);
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const baseRef = process.env.COVERAGE_FLOORS_BASE_REF || "origin/main";
  const violations = runCheck({ root, baseRef });
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(violations, null, 2));
    return;
  }
  if (violations.length === 0) {
    console.log(`coverage floors: none lowered or removed against ${baseRef}.`);
    return;
  }
  for (const v of violations) {
    console.error(
      `  [R-CoverageFloorsRatchet] [${v.kind}] ${v.key}: ${v.detail}`
    );
  }
  console.error(
    "\nA coverage floor may rise, never fall. Fix the coverage instead of the\n" +
      "floor (spec/spa-quality-gates, 'Coverage floors only ratchet up')."
  );
  process.exit(1);
};

// Resolve symlinks so the guard cannot silently skip itself when it is reached
// through a linked directory (import.meta.url is always the real path).
const isMain =
  Boolean(process.argv[1]) &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;

if (isMain) main();
