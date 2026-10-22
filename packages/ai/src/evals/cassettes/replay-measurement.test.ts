import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import benchmarks from "../benchmarks.json";
import type { Benchmark } from "../types";
import {
  FIXTURES_DIR,
  loadCassetteFiles,
  readCassetteFiles,
} from "./cassette-files";
import { PARITY_WARNINGS } from "./cassette-schema";
import { createParserReplaySuite } from "./parser-replay-suite";
import type { ReplaySuite } from "./replay-cassette";
import { replayCassettes } from "./replay-runner";

const CASE = "cycling-simple";
const UNBLOCK = "re-record locally, or retire the id in the manifest";
const PACKAGE_DIR = resolve(import.meta.dirname, "..", "..", "..");
const PROVIDER_KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "OPENAI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
];

const fresh = async () => {
  const suite = createParserReplaySuite();
  const built = await buildCassette(suite, CASE, simpleWorkout("cycling"));
  return { suite, ...built };
};

const withCaseRun = (
  suite: ReplaySuite,
  run: ReplaySuite["cases"][number]["run"]
): ReplaySuite => ({
  ...suite,
  cases: suite.cases.map((c) => (c.id === CASE ? { ...c, run } : c)),
});

const editedBenchmarks = (edit: Partial<Benchmark>): Array<Benchmark> =>
  (benchmarks as Array<Benchmark>).map((b) =>
    b.id === CASE ? { ...b, ...edit } : b
  );

/** Every path under the package except installed and built output, with mtimes. */
const packageSnapshot = (): Array<string> => {
  const walk = (dir: string): Array<string> =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.name === "node_modules" || entry.name === "dist") return [];
      const path = join(dir, entry.name);
      return entry.isDirectory()
        ? walk(path)
        : [`${path}@${statSync(path).mtimeMs}`];
    });
  return walk(PACKAGE_DIR).sort();
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("replay measurement", () => {
  it("should not measure a case that never consumed its cassette", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    const lazy = withCaseRun(suite, async () => [
      { dimension: "steps", status: "passed" },
    ]);

    // Act
    const result = await replayCassettes(lazy, [cassette]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({ cause: "not-consumed" });
    expect(result.faults).toEqual([
      "cassettes not consumed (expected exactly one model call): cycling-simple-1",
      "zero measured cases: a replay that measured nothing fails",
    ]);
    expect(result.exitCode).toBe(1);
  });

  it.each([
    ["no outcome", []],
    [
      "only unmeasured outcomes",
      [{ dimension: "zone", status: "unmeasured", reason: "none declared" }],
    ],
  ] as const)("should not count %s as a pass", async (_label, outcomes) => {
    // Arrange
    const { suite, cassette } = await fresh();
    const empty = withCaseRun(suite, async (model) => {
      await suite.cases.find((c) => c.id === CASE)!.run(model);
      return [...outcomes];
    });

    // Act
    const result = await replayCassettes(empty, [cassette]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({ cause: "nothing-scored" });
    expect(result.faults[0]).toBe(
      "cassettes whose case no scorer measured: cycling-simple-1"
    );
    expect(result.exitCode).toBe(1);
  });

  it("should not measure a cassette requested for another model than the suite's", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    const other = { ...cassette, requestedModelId: "claude-haiku-4-5" };

    // Act
    const result = await replayCassettes(suite, [other]);

    // Assert
    expect(result.measured).toBe(0);
    expect(result.faults[0]).toBe(
      `cassettes recorded for another model than the suite's: cycling-simple-1 — ${UNBLOCK}`
    );
  });

  it("should never measure the synthetic fixture, even relabelled as a real recording", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const [fixture] = loadCassetteFiles(
      readCassetteFiles(FIXTURES_DIR)
    ).cassettes;
    const relabelled = {
      ...fixture!,
      recorder: "claude-cli" as const,
      cliVersion: "2.1.302",
      parityWarnings: [...PARITY_WARNINGS],
    };

    // Act
    const result = await replayCassettes(suite, [relabelled]);

    // Assert
    expect(result.measured).toBe(0);
    expect(result.verdicts[0]).toMatchObject({ cause: "model-mismatch" });
    expect(result.exitCode).toBe(1);
  });

  it("should keep a cassette fresh when only a scorer expectation changes", async () => {
    // Arrange
    const { cassette } = await fresh();
    const tightened = createParserReplaySuite(
      undefined,
      editedBenchmarks({ maxSteps: 1 })
    );

    // Act
    const result = await replayCassettes(tightened, [cassette]);

    // Assert
    expect(result.faults).toEqual([]);
    expect(result.measured).toBe(1);
  });

  it("should mark a cassette stale when the text the model sees changes", async () => {
    // Arrange
    const { cassette } = await fresh();
    const rewritten = createParserReplaySuite(
      undefined,
      editedBenchmarks({ text: "45 minutes easy cycling" })
    );

    // Act
    const result = await replayCassettes(rewritten, [cassette]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({ stale: ["fixture"] });
    expect(result.faults[0]).toBe(
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`
    );
  });

  it("should measure the sentinel failure without writing any file", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const { cassette } = await buildCassette(
      suite,
      CASE,
      simpleWorkout("running")
    );
    const before = packageSnapshot();

    // Act
    const result = await replayCassettes(suite, [cassette]);

    // Assert
    expect(result.faults).toEqual([
      'case cycling-simple failed scorer "sport": Sport mismatch: expected cycling, got running',
    ]);
    expect(packageSnapshot()).toEqual(before);
  });

  it("should replay keyless: no provider key in the env and no network", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    for (const key of PROVIDER_KEYS) vi.stubEnv(key, undefined);
    const fetch = vi.fn(() => {
      throw new Error("replay must not reach the network");
    });
    vi.stubGlobal("fetch", fetch);

    // Act
    const result = await replayCassettes(suite, [cassette]);

    // Assert
    expect(PROVIDER_KEYS.filter((k) => process.env[k] !== undefined)).toEqual(
      []
    );
    expect(result.faults).toEqual([]);
    expect(result.measured).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
