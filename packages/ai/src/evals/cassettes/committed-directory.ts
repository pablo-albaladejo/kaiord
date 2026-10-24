import { parseAll, parseJson } from "./cassette-files";
import type { CassetteFile, LoadedCassettes } from "./cassette-files";
import { checkManifest, duplicatesOf, manifestSchema } from "./manifest";
import type { Manifest } from "./manifest";
import type { ReplaySuite } from "./case-verdict";
import { replayCassettes } from "./replay-runner";
import type { ReplayResult } from "./replay-runner";
import { validateCommittedCassette } from "./validate-cassette";

export const MANIFEST_FILE = "manifest.json";

const UNCOVERED_PATHS =
  "record them locally, or retire the case (its benchmark, manifest entry and cassette)";

const readManifest = (
  file: CassetteFile | undefined
): { manifest: Manifest } | { fault: string } => {
  if (!file?.bytes) return { fault: `no ${MANIFEST_FILE} in the directory` };
  try {
    const parsed = manifestSchema.safeParse(parseJson(file.bytes));
    return parsed.success
      ? { manifest: parsed.data }
      : { fault: `${MANIFEST_FILE}: ${parsed.error.message}` };
  } catch (error) {
    return { fault: `${MANIFEST_FILE}: ${(error as Error).message}` };
  }
};

/**
 * The committed directory: only real cassettes recorded with the official
 * model, one file per id named `<id>.json`, matching the manifest by id and
 * by file digest. Any cassette that raised a fault is left out of
 * `cassettes`, so a tampered, unlisted or duplicated file is never replayed.
 * Its `faults` must reach the exit code: replay through `replayCommitted`, never
 * this plus `replayCassettes`, which would drop them.
 */
export const loadCommittedFiles = (
  files: ReadonlyArray<CassetteFile>
): LoadedCassettes => {
  const manifestFile = files.find((f) => f.name === MANIFEST_FILE);
  const read = readManifest(manifestFile);
  if ("fault" in read) return { cassettes: [], faults: [read.fault] };

  const rest = files.filter((f) => f !== manifestFile);
  const { found, faults } = parseAll(rest, validateCommittedCassette);
  const duplicated = duplicatesOf(found.map((f) => f.cassette.id));
  if (duplicated.length > 0) {
    faults.push(`duplicate cassette ids: ${duplicated.join(", ")}`);
  }
  const unique = found.filter((f) => !duplicated.includes(f.cassette.id));
  const check = checkManifest(read.manifest, unique);
  return {
    cassettes: unique
      .filter((f) => !check.rejected.has(f.cassette.id))
      .map((f) => f.cassette),
    faults: [...faults, ...check.faults],
  };
};

/**
 * A suite case with no real cassette is uncovered, whatever the manifest
 * says: retiring a case removes its benchmark with its entry and cassette.
 * Coverage is by case id, so two cassettes of one case never cover another.
 */
const uncoveredFault = (
  suite: ReplaySuite,
  cassettes: LoadedCassettes["cassettes"]
): Array<string> => {
  const covered = new Set(
    cassettes.filter((c) => c.recorder !== "synthetic").map((c) => c.caseId)
  );
  const ids = suite.cases.map((c) => c.id).filter((id) => !covered.has(id));
  return ids.length > 0
    ? [`uncovered cases: ${ids.join(", ")} — ${UNCOVERED_PATHS}`]
    : [];
};

/**
 * The one entry point for a replay over the committed directory: every load
 * fault reaches `faults` and the exit code, beside the replay's own.
 */
export const replayCommitted = async (
  suite: ReplaySuite,
  files: ReadonlyArray<CassetteFile>
): Promise<ReplayResult> => {
  const { cassettes, faults } = loadCommittedFiles(files);
  return replayCassettes(suite, cassettes, [
    ...faults,
    ...uncoveredFault(suite, cassettes),
  ]);
};
