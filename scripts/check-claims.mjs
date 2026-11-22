#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { proofProblems } from "./lib/claims-proof.mjs";
import { surfaceUnits } from "./lib/claims-units.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

// Every public claim points to its proof. The register (claims/*.json) names
// the surfaces it covers and holds each claim's exact text with its proof.
// Each unit of text on a registered surface must be a register entry, each
// entry must still be on its surface, and each proof must still exist.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CLAIMS_DIR = join(ROOT, "claims");

const surfaceProblems = (surfaces, read) => {
  const problems = [];
  const seen = new Set();
  for (const surface of surfaces) {
    const src = read(surface.file);
    if (src === null) {
      problems.push(`${surface.file}: registered surface does not exist`);
      continue;
    }
    const { units, error } = surfaceUnits(surface, src);
    if (error) {
      problems.push(error);
      continue;
    }
    if (units.length === 0)
      problems.push(`${surface.file}: registered surface shows no text`);
    for (const unit of units) seen.add(unit);
    surface.units = units;
  }
  return { problems, seen };
};

const CLAIM_FIELDS = ["id", "text", "proof"];
const SURFACE_FIELDS = ["file", "intro", "sections", "keys"];

const unknownFields = (what, object, allowed) => {
  const unknown = Object.keys(object).filter((k) => !allowed.includes(k));
  return unknown.length > 0
    ? [`${what} has unknown field(s) ${unknown.join(", ")}`]
    : [];
};

const claimProblems = (claim, read) => {
  const where = `claim "${claim.id}"`;
  const shape = unknownFields(where, claim, CLAIM_FIELDS);
  if (!Array.isArray(claim.proof) || claim.proof.length === 0)
    return [...shape, `${where}: has no proof`];
  return [
    ...shape,
    ...claim.proof.flatMap((proof) =>
      proofProblems(proof, read).map((p) => `${where}: ${p}`)
    ),
  ];
};

// A surface or a claim id belongs to one register file only, so two files
// can never disagree about the same text.
const duplicateProblems = (name, data, owners) => {
  const problems = [];
  for (const surface of data.surfaces) {
    problems.push(
      ...unknownFields(
        `${name}: surface ${surface.file}`,
        surface,
        SURFACE_FIELDS
      )
    );
    const owner = owners.surfaces.get(surface.file);
    if (owner)
      problems.push(
        `${name}: surface ${surface.file} is already registered in ${owner}`
      );
    else owners.surfaces.set(surface.file, name);
  }
  for (const { id } of data.claims) {
    const owner = owners.ids.get(id);
    if (owner)
      problems.push(`${name}: claim id "${id}" is already used in ${owner}`);
    else owners.ids.set(id, name);
  }
  return problems;
};

export function checkClaims({ registers, read }) {
  const problems = [];
  const owners = { surfaces: new Map(), ids: new Map() };
  for (const { name, data } of registers) {
    const duplicates = duplicateProblems(name, data, owners);
    problems.push(...duplicates);
    if (duplicates.length > 0) continue;
    const surfaces = data.surfaces.map((s) => ({ ...s }));
    const found = surfaceProblems(surfaces, read);
    problems.push(...found.problems);
    const texts = new Set(data.claims.map((c) => c.text));
    for (const surface of surfaces) {
      for (const unit of surface.units ?? []) {
        if (!texts.has(unit))
          problems.push(`${surface.file}: unregistered claim "${unit}"`);
      }
    }
    for (const claim of data.claims) {
      if (found.problems.length === 0 && !found.seen.has(claim.text))
        problems.push(
          `${name}: claim "${claim.id}" is on none of its surfaces; delete the entry`
        );
      problems.push(...claimProblems(claim, read));
    }
  }
  return problems;
}

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
  const problems =
    registers.length === 0
      ? ["claims/ holds no register file"]
      : checkClaims({ registers, read: repoReader });
  failIfAny(
    "public-claim problem(s)",
    problems,
    "Each claim on a registered surface needs an entry in claims/*.json with a proof that exists; see claims/README.md."
  );
  console.log("✅ Every claim on a registered surface has a proof that exists");
}
