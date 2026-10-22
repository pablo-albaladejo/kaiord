import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sha256Hex } from "./canonical-hash";
import { manifestFaults, manifestSchema } from "./manifest";
import type { CommittedCassette } from "./manifest";
import type { Cassette } from "./cassette-schema";
import {
  validateCassette,
  validateCommittedCassette,
} from "./validate-cassette";
import type { CassetteValidation } from "./validate-cassette";

export const COMMITTED_DIR = join(import.meta.dirname, "committed");
export const FIXTURES_DIR = join(import.meta.dirname, "fixtures");
export const MANIFEST_FILE = "manifest.json";

export type CassetteFile = { name: string; bytes: Uint8Array };

export type LoadedCassettes = {
  cassettes: Array<Cassette>;
  faults: Array<string>;
};

export const readCassetteFiles = (dir: string): Array<CassetteFile> =>
  readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ name, bytes: readFileSync(join(dir, name)) }));

const parseJson = (file: CassetteFile): unknown =>
  JSON.parse(new TextDecoder().decode(file.bytes));

const parseAll = (
  files: ReadonlyArray<CassetteFile>,
  validate: (raw: unknown) => CassetteValidation
) => {
  const found: Array<CommittedCassette> = [];
  const faults: Array<string> = [];
  for (const file of files) {
    try {
      const result = validate(parseJson(file));
      if (result.ok) {
        found.push({
          cassette: result.cassette,
          digest: sha256Hex(file.bytes),
        });
      } else {
        faults.push(`${file.name}: ${result.errors.join("; ")}`);
      }
    } catch (error) {
      faults.push(`${file.name}: ${(error as Error).message}`);
    }
  }
  return { found, faults };
};

/** Synthetic fixtures and in-memory files: the strict schema only. */
export const loadCassetteFiles = (
  files: ReadonlyArray<CassetteFile>
): LoadedCassettes => {
  const { found, faults } = parseAll(files, validateCassette);
  return { cassettes: found.map((f) => f.cassette), faults };
};

/**
 * The committed directory: every cassette obeys the official-model rule, and
 * the set of real cassettes matches the manifest by id and by file digest.
 */
export const loadCommittedFiles = (
  files: ReadonlyArray<CassetteFile>
): LoadedCassettes => {
  const manifestFile = files.find((f) => f.name === MANIFEST_FILE);
  if (!manifestFile) {
    return { cassettes: [], faults: [`no ${MANIFEST_FILE} in the directory`] };
  }
  const manifest = manifestSchema.safeParse(parseJson(manifestFile));
  if (!manifest.success) {
    return {
      cassettes: [],
      faults: [`${MANIFEST_FILE}: ${manifest.error.message}`],
    };
  }
  const rest = files.filter((f) => f !== manifestFile);
  const { found, faults } = parseAll(rest, validateCommittedCassette);
  return {
    cassettes: found.map((f) => f.cassette),
    faults: [...faults, ...manifestFaults(manifest.data, found)],
  };
};
