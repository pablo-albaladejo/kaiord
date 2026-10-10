import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createRecorder,
  DEFAULT_BASE,
  formatSummary,
  parseArgs,
  readDeployedSha,
  selectChecks,
} from "./lib.mjs";

describe("parseArgs", () => {
  it("should default to the production base and no filter", () => {
    // Arrange
    const argv = [];

    // Act
    const args = parseArgs(argv);

    // Assert
    assert.deepEqual(args, { base: DEFAULT_BASE, only: [] });
  });

  it("should read --base and --only in both spellings and trim slashes", () => {
    // Arrange
    const argv = ["--base", "http://localhost:4173/app/", "--only=a, b,,c"];

    // Act
    const args = parseArgs(argv);

    // Assert
    assert.deepEqual(args, {
      base: "http://localhost:4173/app",
      only: ["a", "b", "c"],
    });
  });

  it("should reject unknown flags and missing values", () => {
    // Arrange
    const bad = [["--nope"], ["--base"], ["--only"]];

    // Act
    const attempts = bad.map((argv) => () => parseArgs(argv));

    // Assert
    for (const attempt of attempts) assert.throws(attempt);
  });
});

describe("selectChecks", () => {
  it("should keep registry order and reject unknown names", () => {
    // Arrange
    const names = ["fit-import", "export", "trends"];

    // Act
    const picked = selectChecks(names, ["trends", "fit-import"]);

    // Assert
    assert.deepEqual(picked, ["fit-import", "trends"]);
    assert.throws(() => selectChecks(names, ["typo"]), /typo/);
  });
});

describe("createRecorder + formatSummary", () => {
  it("should exit 0 only when every check has passes and no failures", () => {
    // Arrange
    const ok = createRecorder("ok");
    ok.assert(true, "works");

    // Act
    const summary = formatSummary([ok.result], { sha: "abc", base: "b" });

    // Assert
    assert.equal(summary.exitCode, 0);
    assert.match(summary.text, /PASS {2}ok/);
    assert.match(summary.text, /1\/1 passed {2}sha=abc/);
  });

  it("should exit 1 on a failed assertion and print the observed state", () => {
    // Arrange
    const bad = createRecorder("bad");
    const returned = bad.assert(false, "date kept", "date=2026-10-10");

    // Act
    const summary = formatSummary([bad.result], { sha: "unknown", base: "b" });

    // Assert
    assert.equal(returned, false);
    assert.equal(summary.exitCode, 1);
    assert.match(summary.text, /FAIL {2}bad/);
    assert.match(summary.text, /x date kept \| observed: date=2026-10-10/);
  });

  it("should treat a check that asserted nothing as a failure", () => {
    // Arrange
    const empty = createRecorder("empty");
    empty.note("only a note");

    // Act
    const summary = formatSummary([empty.result], { sha: "s", base: "b" });

    // Assert
    assert.equal(summary.exitCode, 1);
    assert.match(summary.text, /x no assertion ran/);
  });

  it("should record explicit failures from a thrown step", () => {
    // Arrange
    const rec = createRecorder("thrown");
    rec.assert(true, "first step");

    // Act
    rec.fail("threw: boom");
    const summary = formatSummary([rec.result], { sha: "s", base: "b" });

    // Assert
    assert.equal(summary.exitCode, 1);
    assert.match(summary.text, /x threw: boom/);
  });
});

describe("readDeployedSha", () => {
  it("should cache-bust and return the sha from version.json", async () => {
    // Arrange
    const seen = [];
    const fetchImpl = async (url) => {
      seen.push(url);
      return { ok: true, json: async () => ({ sha: "5a5a95dc" }) };
    };

    // Act
    const sha = await readDeployedSha("https://x/app", fetchImpl, () => 42);

    // Assert
    assert.equal(sha, "5a5a95dc");
    assert.deepEqual(seen, ["https://x/app/version.json?ts=42"]);
  });

  it("should report unknown on 404, bad JSON or a network error", async () => {
    // Arrange
    const fetches = [
      async () => ({ ok: false, json: async () => ({}) }),
      async () => ({ ok: true, json: async () => ({ nope: 1 }) }),
      async () => {
        throw new Error("offline");
      },
    ];

    // Act
    const shas = await Promise.all(
      fetches.map((f) => readDeployedSha("https://x/app", f))
    );

    // Assert
    assert.deepEqual(shas, ["unknown", "unknown", "unknown"]);
  });
});
