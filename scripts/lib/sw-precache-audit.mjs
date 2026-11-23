import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, sep } from "node:path";

// The guard's half of the service worker: what a served `app/` tree and its
// `sw.js` must agree on (design D6). It shares no code with the emitter
// (`sw-manifest.mjs`) on purpose: the exclusions and the key rule are restated
// here, so an emitter that drifts is caught instead of agreed with.

const EXCLUDED = new Set([
  "sw.js",
  "version.json",
  "og-image-editor.png",
  "AGENTS.md",
  "CLAUDE.md",
]);
const isExcluded = (rel) =>
  EXCLUDED.has(basename(rel)) ||
  basename(rel).startsWith(".") ||
  rel.endsWith(".map");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const shipped = (app) =>
  readdirSync(app, { recursive: true })
    .map((entry) => String(entry).split(sep).join("/"))
    .filter((rel) => statSync(join(app, rel)).isFile() && !isExcluded(rel));

/** What makes `source` unfit to be the kill worker. */
export function checkKill(source) {
  const problems = [];
  if (/addEventListener\(\s*["']fetch["']/.test(source)) {
    problems.push("the kill worker has a fetch handler");
  }
  if (/\.claim\(/.test(source)) {
    problems.push("the kill worker calls clients.claim()");
  }
  if (/includeUncontrolled/.test(source)) {
    problems.push("the kill worker reaches windows it does not control");
  }
  return problems;
}

const keyProblem = (rel, url, revision, key) => {
  const hashed = rel.startsWith("assets/");
  if (key === (hashed ? url : `${url}?__rev=${revision}`)) return null;
  return hashed
    ? `${rel}: a hashed chunk keyed as ${key}`
    : `${rel}: not keyed by ?__rev=<revision>`;
};

const entryProblem = (app, rel, revision) => {
  if (isExcluded(rel)) return `${rel}: excluded but listed`;
  if (!existsSync(join(app, rel))) return `${rel}: listed but not shipped`;
  if (sha256(readFileSync(join(app, rel))) !== revision) {
    return `${rel}: shipped bytes do not match its revision`;
  }
  return null;
};

/** Where the manifest and the shipped tree under `base` disagree. */
export function checkManifest(app, base, manifest) {
  if (manifest.length === 0) return ["the manifest is empty"];
  const problems = [];
  const listed = new Set();
  for (const { url, revision, key } of manifest) {
    if (!url.startsWith(base)) {
      problems.push(`${url}: outside the scope ${base}`);
      continue;
    }
    const rel = url.slice(base.length);
    listed.add(rel);
    problems.push(entryProblem(app, rel, revision));
    problems.push(keyProblem(rel, url, revision, key));
  }
  for (const rel of shipped(app)) {
    if (!listed.has(rel)) problems.push(`${rel}: shipped but not precached`);
  }
  return problems.filter(Boolean);
}
