import { describe, expect, it } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import { sha256Hex } from "./canonical-hash";
import {
  COMMITTED_DIR,
  FIXTURES_DIR,
  readCassetteFiles,
} from "./cassette-files";
import type { Cassette } from "./cassette-schema";
import { loadCommittedFiles, replayCommitted } from "./committed-directory";
import { createParserReplaySuite } from "./parser-replay-suite";

type RealFile = { name: string; bytes: Uint8Array };

const UNBLOCK = "re-record locally, or retire the id in the manifest";
/** A well-formed SHA-256 that matches no file here. */
const OTHER_DIGEST = sha256Hex("bytes no cassette here has");
const encode = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value, null, 2));

/** IN-MEMORY files only: nothing here is ever written to disk. */
const cassetteFile = (cassette: Cassette): RealFile => ({
  name: `${cassette.id}.json`,
  bytes: encode(cassette),
});

const manifestFile = (entries: Array<{ id: string; sha256: string }>) => ({
  name: "manifest.json",
  bytes: encode({ cassettes: entries }),
});

const entryFor = (file: RealFile, id: string) => ({
  id,
  sha256: sha256Hex(file.bytes),
});

const realCassette = async (caseId = "cycling-simple") => {
  const suite = createParserReplaySuite();
  const sport = caseId.split("-")[0] ?? "cycling";
  return (await buildCassette(suite, caseId, simpleWorkout(sport))).cassette;
};

describe("loadCommittedFiles", () => {
  it("should accept the committed directory as shipped: one real cassette per benchmark", () => {
    // Arrange
    const files = readCassetteFiles(COMMITTED_DIR);

    // Act
    const { cassettes, faults } = loadCommittedFiles(files);

    // Assert
    expect(files.map((f) => f.name)).toContain("manifest.json");
    expect(faults).toEqual([]);
    expect(cassettes.length).toBe(files.length - 1);
    expect(cassettes.length).toBeGreaterThan(0);
  });

  it("should ship only synthetic fixtures", () => {
    // Arrange
    const files = readCassetteFiles(FIXTURES_DIR);

    // Act
    const recorders = files.map(
      (f) => JSON.parse(new TextDecoder().decode(f.bytes!)).recorder
    );

    // Assert
    expect(recorders.length).toBeGreaterThan(0);
    expect(new Set(recorders)).toEqual(new Set(["synthetic"]));
  });

  it("should pass a listed cassette whose digest matches", async () => {
    // Arrange
    const file = cassetteFile(await realCassette());
    const files = [manifestFile([entryFor(file, "cycling-simple-1")]), file];

    // Act
    const { cassettes, faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([]);
    expect(cassettes.map((c) => c.id)).toEqual(["cycling-simple-1"]);
  });

  it("should fail a listed id with no cassette, naming it and the unblock paths", () => {
    // Arrange
    const files = [manifestFile([{ id: "parse-basic", sha256: OTHER_DIGEST }])];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([`missing cassettes: parse-basic — ${UNBLOCK}`]);
  });

  it("should fail an unlisted real cassette naming its id", async () => {
    // Arrange
    const files = [manifestFile([]), cassetteFile(await realCassette())];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([
      "unlisted cassettes: cycling-simple-1 — only the recorder writes a manifest entry",
    ]);
  });

  it("should fail hand-rewritten hash fields under an unchanged digest, naming the id", async () => {
    // Arrange
    const original = await realCassette();
    const recorded = cassetteFile({ ...original, requestHash: OTHER_DIGEST });
    const rewritten = cassetteFile(original);
    const files = [manifestFile([entryFor(recorded, original.id)]), rewritten];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([
      "cassettes not matching their manifest digest: cycling-simple-1",
    ]);
  });

  it("should pass a retirement: entry and cassette removed in one diff", async () => {
    // Arrange
    const kept = cassetteFile(await realCassette());
    const retired = cassetteFile({ ...(await realCassette()), id: "old-1" });
    const before = [
      entryFor(kept, "cycling-simple-1"),
      entryFor(retired, "old-1"),
    ];
    const after = [manifestFile(before.slice(0, 1)), kept];
    const deletedOnly = [manifestFile(before), kept];

    // Act
    const retirement = loadCommittedFiles(after);
    const silentDelete = loadCommittedFiles(deletedOnly);

    // Assert
    expect(retirement.faults).toEqual([]);
    expect(silentDelete.faults).toEqual([
      `missing cassettes: old-1 — ${UNBLOCK}`,
    ]);
  });

  it("should reject a committed cassette not recorded with the official model", async () => {
    // Arrange
    const cassette = {
      ...(await realCassette()),
      servedModelId: "claude-haiku-4-5",
    };
    const file = cassetteFile(cassette);
    const files = [manifestFile([entryFor(file, cassette.id)]), file];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([
      "cycling-simple-1.json: cycling-simple-1: served claude-haiku-4-5, not recorded with claude-sonnet-5",
      `missing cassettes: cycling-simple-1 — ${UNBLOCK}`,
    ]);
  });

  it("should reject a committed cassette carrying an unknown key, naming it", async () => {
    // Arrange
    const file = cassetteFile({
      ...(await realCassette()),
      session_id: "s",
    } as Cassette);
    const files = [manifestFile([]), file];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([
      'cycling-simple-1.json: unknown key(s) "session_id" at the cassette root',
    ]);
  });

  it("should fault a directory without a manifest", () => {
    // Arrange

    // Act
    const { faults } = loadCommittedFiles([]);

    // Assert
    expect(faults).toEqual(["no manifest.json in the directory"]);
  });

  it("should leave a tampered cassette out of the replayable set", async () => {
    // Arrange
    const file = cassetteFile(await realCassette());
    const files = [
      manifestFile([{ id: "cycling-simple-1", sha256: OTHER_DIGEST }]),
      file,
    ];

    // Act
    const { cassettes } = loadCommittedFiles(files);

    // Assert
    expect(cassettes).toEqual([]);
  });

  it("should reject a synthetic cassette placed in the committed directory", async () => {
    // Arrange
    const synthetic = {
      ...(await realCassette()),
      recorder: "synthetic" as const,
    };
    const file = cassetteFile(synthetic);
    const files = [manifestFile([]), file];

    // Act
    const { cassettes, faults } = loadCommittedFiles(files);

    // Assert
    expect(cassettes).toEqual([]);
    expect(faults).toEqual([
      'cycling-simple-1.json: cycling-simple-1: recorder "synthetic" is not allowed in the committed directory; synthetic fixtures live in fixtures/',
    ]);
  });

  it("should reject a file whose name does not match its cassette id", async () => {
    // Arrange
    const file = {
      ...cassetteFile(await realCassette()),
      name: "renamed.json",
    };
    const files = [manifestFile([entryFor(file, "cycling-simple-1")]), file];

    // Act
    const { cassettes, faults } = loadCommittedFiles(files);

    // Assert
    expect(cassettes).toEqual([]);
    expect(faults).toEqual([
      "renamed.json: holds cassette cycling-simple-1",
      `missing cassettes: cycling-simple-1 — ${UNBLOCK}`,
    ]);
  });

  it("should reject duplicate cassette ids and replay neither copy", async () => {
    // Arrange
    const file = cassetteFile(await realCassette());
    const files = [
      manifestFile([entryFor(file, "cycling-simple-1")]),
      file,
      file,
    ];

    // Act
    const { cassettes, faults } = loadCommittedFiles(files);

    // Assert
    expect(cassettes).toEqual([]);
    expect(faults[0]).toBe("duplicate cassette ids: cycling-simple-1");
  });

  it("should reject duplicate manifest entries", async () => {
    // Arrange
    const file = cassetteFile(await realCassette());
    const entry = entryFor(file, "cycling-simple-1");
    const files = [manifestFile([entry, entry]), file];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual(["duplicate manifest entries: cycling-simple-1"]);
  });

  it("should fault a manifest that is not valid JSON instead of throwing", () => {
    // Arrange
    const files = [
      { name: "manifest.json", bytes: new TextEncoder().encode("{") },
    ];

    // Act
    const { cassettes, faults } = loadCommittedFiles(files);

    // Assert
    expect(cassettes).toEqual([]);
    expect(faults).toHaveLength(1);
    expect(faults[0]).toMatch(/^manifest\.json: /);
  });

  it.each([
    [{ name: "nested" }, "nested: not a regular file"],
    [
      { name: "notes.txt", bytes: new TextEncoder().encode("x") },
      "notes.txt: not a .json file",
    ],
  ])("should fault a stray entry %o", (entry, fault) => {
    // Arrange
    const files = [manifestFile([]), entry];

    // Act
    const { faults } = loadCommittedFiles(files);

    // Assert
    expect(faults).toEqual([fault]);
  });
});

describe("replayCommitted", () => {
  it("should exit non-zero on a tampered committed file, naming its id", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const original = await realCassette();
    const recorded = cassetteFile({ ...original, requestHash: OTHER_DIGEST });
    const rewritten = cassetteFile(original);
    const files = [manifestFile([entryFor(recorded, original.id)]), rewritten];

    // Act
    const result = await replayCommitted(suite, files);

    // Assert
    expect(result.exitCode).toBe(1);
    expect(result.measured).toBe(0);
    expect(result.faults).toContain(
      "cassettes not matching their manifest digest: cycling-simple-1"
    );
  });

  it("should replay a listed fresh cassette green", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const file = cassetteFile(await realCassette());
    const files = [manifestFile([entryFor(file, "cycling-simple-1")]), file];

    // Act
    const result = await replayCommitted(suite, files);

    // Assert
    expect(result.faults).toEqual([]);
    expect(result.measured).toBe(1);
    expect(result.exitCode).toBe(0);
  });

  it("should fail a listed stale cassette naming its id and both unblock paths", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const file = cassetteFile({
      ...(await realCassette()),
      requestHash: OTHER_DIGEST,
    });
    const files = [manifestFile([entryFor(file, "cycling-simple-1")]), file];

    // Act
    const result = await replayCommitted(suite, files);

    // Assert
    expect(result.faults[0]).toBe(
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`
    );
    expect(result.exitCode).toBe(1);
  });
});
