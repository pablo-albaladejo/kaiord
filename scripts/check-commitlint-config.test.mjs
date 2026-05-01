// Tests for commitlint.config.mjs and the source-of-truth block in
// .claude/skills/guidelines/git-strategy/SKILL.md (rule R-CommitFormat).
//
// Verifies:
//   1. The SKILL.md `<!-- commitlint-source-of-truth -->` block parses to
//      arrays byte-equal (deepStrictEqual) to TYPE_ENUM and SCOPE_ENUM in
//      commitlint.vocab.mjs. Drift in either direction fails CI.
//   2. Real commit-message subjects pipe through commitlint with the
//      expected exit codes.
//
// Subprocess strategy: invoke `node_modules/.bin/commitlint` directly
// (NOT `pnpm exec commitlint`) to avoid the 200-500ms pnpm-wrapper
// overhead per call. Total target latency for the four pipes: ≤ 1 second.
// Use `node:child_process.spawnSync({ input, encoding: "utf8" })`.

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { SCOPE_ENUM, TYPE_ENUM } from "../commitlint.vocab.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SKILL_MD_PATH = join(
  REPO_ROOT,
  ".claude",
  "skills",
  "guidelines",
  "git-strategy",
  "SKILL.md"
);
const COMMITLINT_BIN = join(REPO_ROOT, "node_modules", ".bin", "commitlint");

function parseSourceOfTruth(skillSrc) {
  const startMarker = "<!-- commitlint-source-of-truth:start -->";
  const endMarker = "<!-- commitlint-source-of-truth:end -->";
  const startIdx = skillSrc.indexOf(startMarker);
  const endIdx = skillSrc.indexOf(endMarker);
  assert.ok(startIdx >= 0, "commitlint-source-of-truth:start marker missing");
  assert.ok(endIdx > startIdx, "commitlint-source-of-truth:end marker missing");
  const block = skillSrc.slice(startIdx + startMarker.length, endIdx);
  const types = [];
  const scopes = [];
  let section = null;
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith("```")) continue;
    if (line === "# types") {
      section = "types";
      continue;
    }
    if (line === "# scopes") {
      section = "scopes";
      continue;
    }
    if (line.startsWith("#")) continue;
    if (section === "types") types.push(line);
    else if (section === "scopes") scopes.push(line);
  }
  return { types, scopes };
}

describe("commitlint vocab drift", () => {
  test("SKILL.md block matches commitlint.vocab.mjs (array-equality)", () => {
    const src = readFileSync(SKILL_MD_PATH, "utf8");
    const { types, scopes } = parseSourceOfTruth(src);
    assert.deepStrictEqual(types, TYPE_ENUM);
    assert.deepStrictEqual(scopes, SCOPE_ENUM);
  });

  test("parser: extra blank lines do not affect output", () => {
    const block = `\n# types\n\nfeat\n\nfix\n\n# scopes\n\ncore\n\n`;
    const fixture = `<!-- commitlint-source-of-truth:start -->${block}<!-- commitlint-source-of-truth:end -->`;
    const { types, scopes } = parseSourceOfTruth(fixture);
    assert.deepStrictEqual(types, ["feat", "fix"]);
    assert.deepStrictEqual(scopes, ["core"]);
  });

  test("parser: extra non-section comment line is treated as ignorable", () => {
    const block = `\n# types\n# extra comment line\nfeat\n# scopes\ncore\n`;
    const fixture = `<!-- commitlint-source-of-truth:start -->${block}<!-- commitlint-source-of-truth:end -->`;
    const { types, scopes } = parseSourceOfTruth(fixture);
    assert.deepStrictEqual(types, ["feat"]);
    assert.deepStrictEqual(scopes, ["core"]);
  });
});

function runCommitlint(subject) {
  if (!existsSync(COMMITLINT_BIN)) {
    return { skipped: true };
  }
  const res = spawnSync(COMMITLINT_BIN, [], {
    input: subject,
    encoding: "utf8",
    timeout: 10_000,
  });
  return { code: res.status, stderr: res.stderr, stdout: res.stdout };
}

describe("commitlint subject acceptance", () => {
  test("chore(openspec): archive cleanup → exit 0", () => {
    const r = runCommitlint("chore(openspec): archive cleanup-may-2026");
    if (r.skipped) return;
    assert.equal(
      r.code,
      0,
      `expected 0, got ${r.code}\n${r.stderr}\n${r.stdout}`
    );
  });

  test("feat(banana): unknown scope → non-zero", () => {
    const r = runCommitlint("feat(banana): add new flow");
    if (r.skipped) return;
    assert.notEqual(r.code, 0, "expected non-zero for unknown scope");
  });

  test("openspec: x — type-not-allowed → non-zero", () => {
    const r = runCommitlint("openspec: archive cleanup-may-2026");
    if (r.skipped) return;
    assert.notEqual(r.code, 0, "expected non-zero for type-not-in-enum");
  });

  test("refactor(core,fit,tcx): multi-scope → non-zero", () => {
    const r = runCommitlint("refactor(core,fit,tcx): unify foo");
    if (r.skipped) return;
    assert.notEqual(r.code, 0, "expected non-zero for multi-scope subject");
  });

  test("feat(core): valid subject → exit 0", () => {
    const r = runCommitlint("feat(core): add fromBinary");
    if (r.skipped) return;
    assert.equal(
      r.code,
      0,
      `expected 0, got ${r.code}\n${r.stderr}\n${r.stdout}`
    );
  });

  // changesets/action emits a "Version Packages" commit during the Release
  // workflow. It has no conventional-commit type and would otherwise be
  // rejected by the husky commit-msg hook, breaking the entire release
  // pipeline. The `ignores` predicate in commitlint.config.mjs allowlists
  // that exact subject.
  test("Version Packages (changesets bot) → exit 0", () => {
    const r = runCommitlint("Version Packages");
    if (r.skipped) return;
    assert.equal(
      r.code,
      0,
      `expected 0, got ${r.code}\n${r.stderr}\n${r.stdout}`
    );
  });

  test("Version Packagesfoo (lookalike, no boundary) → non-zero", () => {
    const r = runCommitlint("Version Packagesfoo");
    if (r.skipped) return;
    assert.notEqual(
      r.code,
      0,
      "expected non-zero: only the exact bot subject is allowlisted"
    );
  });
});
