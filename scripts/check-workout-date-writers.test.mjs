/**
 * Co-located tests for `check-workout-date-writers.mjs`: fixture trees
 * written to a temp directory, checked against a fixture registry.
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  findWriteLines,
  runCheck,
  WORKOUT_DATE_WRITERS,
} from "./check-workout-date-writers.mjs";

const MOVE = `export const move = async (deps) => {
  await deps.workouts.put({ ...w, date });
  await deps.sessionMatch.updateDate(m.id, date, now);
};
`;
const CREATE = `export const create = (db, row) => db.table("workouts").put(row);\n`;

const withTree = (files, body) => {
  const root = mkdtempSync(join(tmpdir(), "date-writers-"));
  try {
    for (const [file, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), source);
    }
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const REGISTRY = [
  { file: "app/move.ts", reason: "date-writer", note: "moves" },
  { file: "ui/create.ts", reason: "creator", note: "creates" },
];

test("should pass a tree whose every writer is classified", () => {
  // Arrange
  const files = {
    "app/move.ts": MOVE,
    "ui/create.ts": CREATE,
    "ui/create.test.ts": `persistence.workouts.put(stale);\n`,
    "app/read.ts": `// workouts.put( is only named here\nexport {};\n`,
  };

  // Act
  const problems = withTree(files, (root) =>
    runCheck({ root, registry: REGISTRY })
  );

  // Assert
  assert.deepEqual(problems, []);
});

test("should fail an unlisted writer and name its file and line", () => {
  // Arrange
  const files = {
    "app/move.ts": MOVE,
    "ui/create.ts": CREATE,
    "ui/skip.ts": `const a = 1;\nawait persistence.workouts.bulkPut([stale]);\n`,
  };

  // Act
  const problems = withTree(files, (root) =>
    runCheck({ root, registry: REGISTRY })
  );

  // Assert
  assert.deepEqual(problems, ["ui/skip.ts:2: unclassified workout write"]);
});

test("should fail a date-writer that never re-dates the match", () => {
  // Arrange
  const files = {
    "app/move.ts": `await deps.workouts.put({ ...w, date });\n`,
    "ui/create.ts": CREATE,
  };

  // Act
  const problems = withTree(files, (root) =>
    runCheck({ root, registry: REGISTRY })
  );

  // Assert
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^app\/move\.ts: a date-writer must call/);
});

test("should accept a date-writer that re-dates the match through its via module", () => {
  // Arrange
  const files = {
    "app/follow.ts": `await deps.workouts.put(next);\nawait redate(deps);\n`,
    "app/redate.ts": `await sessionMatch.updateDate(m.id, d, now);\n`,
  };
  const registry = [
    {
      file: "app/follow.ts",
      reason: "date-writer",
      via: "app/redate.ts",
      note: "follows",
    },
  ];

  // Act
  const problems = withTree(files, (root) => runCheck({ root, registry }));

  // Assert
  assert.deepEqual(problems, []);
});

test("should fail a stale registry entry", () => {
  // Arrange
  const files = {
    "app/move.ts": MOVE,
    "ui/create.ts": `export const create = (save, row) => save(row);\n`,
  };

  // Act
  const problems = withTree(files, (root) =>
    runCheck({ root, registry: REGISTRY })
  );

  // Assert
  assert.deepEqual(problems, [
    "ui/create.ts: stale entry, no workout write left",
  ]);
});

test("should find writes through deps, persistence, db and a table call", () => {
  // Arrange
  const source = [
    "deps.workouts.put(a);",
    "persistence.workouts.bulkPut(b);",
    "db.workouts.put(c);",
    'db.table("workouts").put(d);',
    "persistence.workouts.getById(e);",
  ].join("\n");

  // Act
  const lines = findWriteLines(source);

  // Assert
  assert.deepEqual(lines, [1, 2, 3, 4]);
});

test("should classify every entry with a known reason and a note", () => {
  // Arrange
  const reasons = new Set(["date-writer", "date-preserving", "creator"]);

  // Act
  const bad = WORKOUT_DATE_WRITERS.filter(
    (e) => !reasons.has(e.reason) || !e.note
  );

  // Assert
  assert.deepEqual(bad, []);
});

test("should pass on the real SPA tree", () => {
  // Arrange

  // Act
  const problems = runCheck();

  // Assert
  assert.deepEqual(problems, []);
});
