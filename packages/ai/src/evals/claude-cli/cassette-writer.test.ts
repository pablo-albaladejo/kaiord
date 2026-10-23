import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import { sha256Hex } from "../cassettes/canonical-hash";
import { parseAll, readCassetteFiles } from "../cassettes/cassette-files";
import type { Cassette } from "../cassettes/cassette-schema";
import { checkManifest, manifestSchema } from "../cassettes/manifest";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import { validateCommittedCassette } from "../cassettes/validate-cassette";
import { isHarnessFault } from "./harness-fault";
import { ITERATION_DIR, serialize, writeCassette } from "./cassette-writer";
import type { CassetteTargets } from "./cassette-writer";

let root: string;
let targets: CassetteTargets;

const cassetteFor = async (modelId: string, caseId = "cycling-simple") =>
  (
    await buildCassette(
      createParserReplaySuite(modelId),
      caseId,
      simpleWorkout("cycling")
    )
  ).cassette;

const manifestOf = () =>
  manifestSchema.parse(
    JSON.parse(
      readFileSync(join(targets.committedDir, "manifest.json"), "utf8")
    )
  );

const faultOf = (write: () => unknown) => {
  try {
    write();
  } catch (error) {
    return isHarnessFault(error) ? error.message : `other: ${error}`;
  }
  return "written";
};

describe("writeCassette", () => {
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "cassette-writer-"));
    targets = {
      committedDir: join(root, "committed"),
      iterationDir: join(root, "iteration"),
      servedForm: "bare",
    };
    mkdirSync(targets.committedDir);
    writeFileSync(
      join(targets.committedDir, "manifest.json"),
      serialize({ cassettes: [] })
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("should keep the iteration directory gitignored, out of the committed tree", () => {
    // Arrange
    const gitignore = readFileSync(
      join(import.meta.dirname, "../../../../../.gitignore"),
      "utf8"
    );

    // Act
    const relative = ITERATION_DIR.split("/packages/ai/")[1];

    // Assert
    expect(relative).toBe(".eval-cassettes");
    expect(gitignore).toContain("packages/ai/.eval-cassettes/");
    expect(gitignore).toContain("eval-report-*.json");
  });

  it("should write an official cassette with its manifest entry over the exact bytes", async () => {
    // Arrange
    const cassette = await cassetteFor("claude-sonnet-5");

    // Act
    const path = writeCassette(cassette, targets);

    // Assert
    const bytes = readFileSync(path);
    expect(manifestOf().cassettes).toEqual([
      { id: cassette.id, sha256: sha256Hex(bytes) },
    ]);
    const { found, faults } = parseAll(
      readCassetteFiles(targets.committedDir).filter(
        (f) => f.name !== "manifest.json"
      ),
      validateCommittedCassette
    );
    expect(faults).toEqual([]);
    expect(checkManifest(manifestOf(), found).faults).toEqual([]);
  });

  it("should keep the manifest entries of distinct cases sorted by id", async () => {
    // Arrange
    const a = await cassetteFor("claude-sonnet-5", "cycling-simple");
    const b = await cassetteFor("claude-sonnet-5", "cycling-endurance");

    // Act
    writeCassette(a, targets);
    writeCassette(b, targets);

    // Assert
    expect(manifestOf().cassettes.map((e) => e.id)).toEqual([b.id, a.id]);
  });

  it("should write no cassette when the manifest does not validate", async () => {
    // Arrange
    const cassette = await cassetteFor("claude-sonnet-5");
    writeFileSync(join(targets.committedDir, "manifest.json"), "{}\n");

    // Act
    const fault = faultOf(() => writeCassette(cassette, targets));

    // Assert
    expect(fault).toContain(`could not write cassette ${cassette.id}`);
    expect(readdirSync(targets.committedDir)).toEqual(["manifest.json"]);
  });

  it("should raise a disk failure as a harness fault", async () => {
    // Arrange
    const cassette = await cassetteFor("claude-haiku-4-5");
    const blocked = join(root, "a-file");
    writeFileSync(blocked, "");

    // Act
    const fault = faultOf(() =>
      writeCassette(cassette, { ...targets, iterationDir: join(blocked, "x") })
    );

    // Assert
    expect(fault).toContain(`could not write cassette ${cassette.id}`);
  });

  it("should refuse every committed write while the served form is unpinned", async () => {
    // Arrange
    const cassette = await cassetteFor("claude-sonnet-5");

    // Act
    const fault = faultOf(() =>
      writeCassette(cassette, { ...targets, servedForm: null })
    );

    // Assert
    expect(fault).toContain("OFFICIAL_SERVED_FORM is not pinned");
    expect(readdirSync(targets.committedDir)).toEqual(["manifest.json"]);
    expect(manifestOf().cassettes).toEqual([]);
  });

  it("should refuse a served id outside the pinned form or a synthetic recorder", async () => {
    // Arrange
    const base = await cassetteFor("claude-sonnet-5");
    const dated: Cassette = {
      ...base,
      servedModelId: "claude-sonnet-5-20261001",
    };
    const synthetic: Cassette = { ...base, recorder: "synthetic" };

    // Act
    const faults = [
      faultOf(() => writeCassette(dated, targets)),
      faultOf(() => writeCassette(synthetic, targets)),
    ];

    // Assert
    expect(faults[0]).toContain("served claude-sonnet-5-20261001");
    expect(faults[1]).toContain('recorder "synthetic" is not allowed');
    expect(readdirSync(targets.committedDir)).toEqual(["manifest.json"]);
  });

  it("should write any other model to the iteration directory, never the manifest", async () => {
    // Arrange
    const cassette = await cassetteFor("claude-haiku-4-5");

    // Act
    const path = writeCassette(cassette, targets);

    // Assert
    expect(path).toBe(join(targets.iterationDir, `${cassette.id}.json`));
    expect(readdirSync(targets.committedDir)).toEqual(["manifest.json"]);
    expect(manifestOf().cassettes).toEqual([]);
  });
});
