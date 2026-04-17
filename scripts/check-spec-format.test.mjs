// Tests for scripts/check-spec-format.mjs using node:test.
// Run with: node --test scripts/check-spec-format.test.mjs

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { checkSpec } from "./check-spec-format.mjs";

const FILE = "openspec/specs/test/spec.md";

const happy = `> Synced: 2026-04-17

# Sample Capability

## Purpose

A sample capability used only for tests.

## Requirements

### Requirement: Sample requirement

The system SHALL behave as described.

#### Scenario: Sample scenario

- **WHEN** a trigger happens
- **THEN** the observable outcome occurs
`;

test("happy path passes", () => {
  assert.deepEqual(checkSpec(FILE, happy), []);
});

test("missing Synced header is rejected", () => {
  const src = happy.replace(/^> Synced:.*\n/, "");
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("> Synced: YYYY-MM-DD")),
    "expected Synced violation"
  );
});

test("missing Purpose is rejected", () => {
  const src = happy.replace(
    /## Purpose\n\nA sample capability used only for tests.\n\n/,
    ""
  );
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes('"## Purpose"')),
    "expected Purpose violation"
  );
});

test("missing Requirements is rejected", () => {
  const src = happy.replace(/## Requirements[\s\S]*/, "");
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes('"## Requirements"')),
    "expected Requirements violation"
  );
});

test("two H1 headers are rejected", () => {
  const src = happy.replace(
    "# Sample Capability",
    "# Sample Capability\n\n# Extra H1"
  );
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("H1 title")),
    "expected H1 violation"
  );
});

test("ADDED Requirements delta header is rejected", () => {
  const src = happy.replace("## Requirements", "## ADDED Requirements");
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("change-delta header")),
    "expected delta-header violation"
  );
});

test("placeholder in heading is rejected", () => {
  const src = happy.replace("# Sample Capability", "# <Capability Title>");
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("<Placeholder>")),
    "expected placeholder violation"
  );
});

test("Purpose after Requirements is rejected", () => {
  const src = `> Synced: 2026-04-17

# Sample Capability

## Requirements

### Requirement: Sample

The system SHALL behave.

#### Scenario: works

- **WHEN** trigger
- **THEN** outcome

## Purpose

Should be above Requirements.
`;
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("Purpose") && v.includes("before")),
    "expected ordering violation"
  );
});

test("orphan scenario (before any Requirement) is rejected", () => {
  const src = `> Synced: 2026-04-17

# Sample Capability

## Purpose

Sample.

## Requirements

#### Scenario: orphan

- **WHEN** trigger
- **THEN** outcome
`;
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("orphan scenario")),
    "expected orphan-scenario violation"
  );
});

test("Synced annotation with unknown change slug is rejected", () => {
  const src = happy.replace(
    "> Synced: 2026-04-17",
    "> Synced: 2026-04-17 (this-slug-does-not-exist-12345)"
  );
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("unknown change slug")),
    "expected unknown-slug violation"
  );
});

test("Synced annotation with known archived slug is accepted", () => {
  // settings-train2go-bridge is archived as 2026-04-15-settings-train2go-bridge.
  // The resolver MUST recognize the plain slug via the anchored regex.
  const src = happy.replace(
    "> Synced: 2026-04-17",
    "> Synced: 2026-04-17 (settings-train2go-bridge)"
  );
  const violations = checkSpec(FILE, src);
  assert.ok(
    !violations.some((v) => v.includes("unknown change slug")),
    `valid slug rejected: ${violations.join(" | ")}`
  );
});

test("Synced slug that only suffix-matches does NOT resolve (no collision)", () => {
  // "bridge" is a suffix of "2026-04-10-garmin-bridge" but is NOT a valid
  // standalone slug. The anchored regex must reject this collision.
  const src = happy.replace(
    "> Synced: 2026-04-17",
    "> Synced: 2026-04-17 (bridge)"
  );
  const violations = checkSpec(FILE, src);
  assert.ok(
    violations.some((v) => v.includes("unknown change slug")),
    "expected suffix collision to be rejected"
  );
});
