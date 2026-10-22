import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { simpleWorkout } from "../../test-utils/cassette-builder";
import { cliRun } from "../../test-utils/claude-cli-doubles";
import { parseAll, readCassetteFiles } from "../cassettes/cassette-files";
import type { ReplayCase } from "../cassettes/case-verdict";
import type { Cassette } from "../cassettes/cassette-schema";
import { checkManifest, manifestSchema } from "../cassettes/manifest";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import { createReplayModel } from "../cassettes/replay-model";
import { validateCommittedCassette } from "../cassettes/validate-cassette";
import { serialize, writeCassette } from "./cassette-writer";
import type { CassetteTargets } from "./cassette-writer";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { recordCase } from "./record-case";

const suite = createParserReplaySuite("claude-sonnet-5");
const replayCase = suite.cases.find(
  (c) => c.id === "cycling-simple"
) as ReplayCase;
const FIRST = new Date("2026-10-01T10:00:00.000Z");
const SECOND = new Date("2026-10-22T10:00:00.000Z");
const FIRST_SECONDS = 1800;
const SECOND_SECONDS = 2400;

const modelAnswering = (seconds: number) =>
  createClaudeCliLanguageModel({
    modelId: "claude-sonnet-5",
    call: async () =>
      cliRun({ structuredOutput: simpleWorkout("cycling", seconds) }),
  });

let root: string;
let targets: CassetteTargets;

describe("re-recording a case", () => {
  beforeEach(() => {
    vi.stubGlobal("AI_SDK_LOG_WARNINGS", false);
    root = mkdtempSync(join(tmpdir(), "re-record-"));
    targets = {
      committedDir: root,
      iterationDir: join(root, "it"),
      servedForm: "bare",
    };
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "manifest.json"), serialize({ cassettes: [] }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  it("should replace the cassette and its manifest entry, and replay fresh", async () => {
    // Arrange
    const first = await recordCase(
      suite,
      replayCase,
      modelAnswering(FIRST_SECONDS),
      () => FIRST
    );
    writeCassette(first.cassette, targets);
    const second = await recordCase(
      suite,
      replayCase,
      modelAnswering(SECOND_SECONDS),
      () => SECOND
    );

    // Act
    writeCassette(second.cassette, targets);

    // Assert
    expect(readdirSync(root).sort()).toEqual([
      "cycling-simple.json",
      "manifest.json",
    ]);
    const manifest = manifestSchema.parse(
      JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"))
    );
    const { found, faults } = parseAll(
      readCassetteFiles(root).filter((f) => f.name !== "manifest.json"),
      validateCommittedCassette
    );
    expect(faults).toEqual([]);
    expect(manifest.cassettes).toHaveLength(1);
    expect(checkManifest(manifest, found).faults).toEqual([]);
    const onDisk = found[0]?.cassette as Cassette;
    expect(onDisk.recordedAt).toBe(SECOND.toISOString());
    const onStale = vi.fn();
    await replayCase.run(createReplayModel(onDisk, suite.modelId, onStale));
    expect(onStale).not.toHaveBeenCalled();
  });
});
