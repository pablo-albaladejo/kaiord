/**
 * Co-located tests for `check-session-match-id-shape.mjs` — exercises
 * `isAllowedExpression` and `scanFile` against good/bad fixture
 * sources written to a temp directory.
 *
 * Run via `node --test scripts/*.test.mjs` (the `pnpm test:scripts`
 * entry); no third-party deps.
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { strict as assert } from "node:assert";

import {
  isAllowedExpression,
  scanFile,
} from "./check-session-match-id-shape.mjs";

const GOOD_FIXTURES = [
  ["buildCoachingActivityId(profileId, source, sourceId)", "factory"],
  ["toPersistedCoachingActivityId(profileId, activity.id)", "factory-vm"],
  ["activity.id", "record-access"],
  ["record.id", "alt-record-access"],
  ["coachingActivityIdRecord.id", "ends-with-record"],
  ["composite", "canonical local"],
  ["newCoachingActivityId", "ends-with-id"],
  ["input.coachingActivityId", "forwarded-param"],
  ['"p1:train2go:1"', "string-literal-fixture"],
];

const BAD_FIXTURES = [
  ["`${activity.id}`", "template-literal — the original H7 shape"],
  ["`${source}:${sourceId}`", "template-literal short form"],
  ["computeShortId()", "unknown call"],
  ["someRandomLocal", "unrelated bare ident"],
];

test("isAllowedExpression accepts canonical shapes", () => {
  for (const [expr, label] of GOOD_FIXTURES) {
    assert.equal(isAllowedExpression(expr), true, `good: ${label} → ${expr}`);
  }
});

test("isAllowedExpression rejects SHORT-form / template shapes", () => {
  for (const [expr, label] of BAD_FIXTURES) {
    assert.equal(isAllowedExpression(expr), false, `bad: ${label} → ${expr}`);
  }
});

test("scanFile flags a template-literal SHORT-form write inside a call to ensureSessionMatch", () => {
  const dir = mkdtempSync(join(tmpdir(), "shape-check-"));
  const file = join(dir, "fixture-bad.ts");
  writeFileSync(
    file,
    `
import { ensureSessionMatch } from "./x";
declare const activity: { id: string };
declare const sessionMatches: unknown;
await ensureSessionMatch(sessionMatches, {
  profileId: "p1",
  coachingActivityId: \`\${activity.id}\`,
  workoutId: "w-1",
  date: "2026-04-29",
  source: "manual",
  newId: () => "x",
  clock: () => "y",
});
`,
    "utf8"
  );
  try {
    const violations = scanFile(file, dir);
    assert.equal(violations.length, 1);
    assert.equal(violations[0]?.kind, "property");
    assert.match(violations[0]?.expr ?? "", /`\$\{activity\.id\}`/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scanFile reports no violation for a canonical buildCoachingActivityId write", () => {
  const dir = mkdtempSync(join(tmpdir(), "shape-check-"));
  const file = join(dir, "fixture-good.ts");
  writeFileSync(
    file,
    `
import { ensureSessionMatch } from "./x";
import { buildCoachingActivityId } from "./y";
declare const activity: { profileId: string; source: string; sourceId: string };
declare const sessionMatches: unknown;
await ensureSessionMatch(sessionMatches, {
  profileId: activity.profileId,
  coachingActivityId: buildCoachingActivityId(
    activity.profileId,
    activity.source,
    activity.sourceId
  ),
  workoutId: "w-1",
  date: "2026-04-29",
  source: "auto-coaching",
  newId: () => "x",
  clock: () => "y",
});
`,
    "utf8"
  );
  try {
    const violations = scanFile(file, dir);
    assert.deepEqual(violations, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scanFile flags a Dexie reader using the in-memory CoachingActivity.id (SHORT)", () => {
  const dir = mkdtempSync(join(tmpdir(), "shape-check-"));
  const file = join(dir, "fixture-bad-reader.ts");
  writeFileSync(
    file,
    `
declare const activity: { id: string };
declare const profileId: string;
declare const sessionMatches: unknown;
declare const db: any;
await db
  .table("sessionMatches")
  .where("[profileId+coachingActivityId]")
  .equals([profileId, \`\${activity.id}\`])
  .first();
`,
    "utf8"
  );
  try {
    const violations = scanFile(file, dir);
    assert.equal(violations.length, 1);
    assert.equal(violations[0]?.kind, "reader");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
