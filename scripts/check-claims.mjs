#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { duplicateProblems } from "./lib/claims-owners.mjs";
import { roundTripCiProblems } from "./lib/claims-round-trip.mjs";
import { registerProblems } from "./lib/claims-register.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

// Every public claim points to its proof. The register (claims/*.json) names
// the surfaces it covers and holds each claim's exact text with its proof.
// Each unit of text on a registered surface must be a register entry, as
// many times as it appears, each entry must still be on its surface, and
// each claim that states a fact must be proven by a running test or pinned
// code, or declared by the owner's author statement (counted apart, never as
// proven); a label states nothing, an external claim is read again in time.
// A Round-trip claim names its formats and is proven by each one's contract
// test, which the CI round-trip job runs (lib/claims-round-trip.mjs).

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CLAIMS_DIR = join(ROOT, "claims");

// { problems, summary }: summary counts claims by kind and by proof.
export function checkClaimRegisters({ registers, read, today = Date.now() }) {
  const problems = [];
  const owners = { surfaces: new Map(), ids: new Map() };
  const strength = [];
  for (const { name, data } of registers) {
    const duplicates = duplicateProblems(name, data, owners);
    problems.push(...duplicates);
    if (duplicates.length > 0) continue;
    const found = registerProblems(name, data, read, today);
    problems.push(...found.problems);
    strength.push(...found.strength);
  }
  const n = (kind) => strength.filter((s) => s === kind).length;
  const summary = `${strength.length} claims: ${n("label")} labels, ${n("external")} external, ${n("test")} proven by test, ${n("pinned")} by pinned code, ${n("statement")} declared by author statement, ${n("weak")} unproven`;
  return { problems, summary };
}

export const checkClaims = (options) => checkClaimRegisters(options).problems;

// Repo-relative paths only: a proof outside the repo proves nothing here.
export const fsReader = (root) => (path) => {
  if (
    typeof path !== "string" ||
    isAbsolute(path) ||
    path.split(/[\\/]/).includes("..")
  )
    return null;
  const full = join(root, path);
  return existsSync(full) && statSync(full).isFile()
    ? readFileSync(full, "utf8")
    : null;
};

export const repoReader = fsReader(ROOT);

export const loadRegisters = (dir = CLAIMS_DIR) =>
  readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({
      name: `claims/${name}`,
      data: JSON.parse(readFileSync(join(dir, name), "utf8")),
    }));

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const registers = loadRegisters();
  const { problems, summary } =
    registers.length === 0
      ? { problems: ["claims/ holds no register file"], summary: "0 claims" }
      : checkClaimRegisters({ registers, read: repoReader });
  console.log(summary);
  failIfAny(
    "public-claim problem(s)",
    [
      ...problems,
      ...roundTripCiProblems(repoReader(".github/workflows/ci.yml")),
    ],
    "Each claim on a registered surface needs an entry in claims/*.json with a proof that holds; see claims/README.md."
  );
  console.log("✅ Every claim on a registered surface has a proof that holds");
}
