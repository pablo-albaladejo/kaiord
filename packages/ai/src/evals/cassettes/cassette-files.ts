import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sha256Hex } from "./canonical-hash";
import type { CommittedCassette } from "./manifest";
import type { Cassette } from "./cassette-schema";
import { validateCassette } from "./validate-cassette";
import type { CassetteValidation } from "./validate-cassette";

export const COMMITTED_DIR = join(import.meta.dirname, "committed");
export const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

/** A directory entry; `bytes` is absent when it is not a regular file. */
export type CassetteFile = { name: string; bytes?: Uint8Array };

export type LoadedCassettes = {
  /** Only cassettes that raised no fault: a faulted file is never replayed. */
  cassettes: Array<Cassette>;
  faults: Array<string>;
};

/** Every entry of `dir`, so a stray subdirectory or file can be reported. */
export const readCassetteFiles = (dir: string): Array<CassetteFile> =>
  readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) =>
      entry.isFile()
        ? { name: entry.name, bytes: readFileSync(join(dir, entry.name)) }
        : { name: entry.name }
    );

export const parseJson = (bytes: Uint8Array): unknown =>
  JSON.parse(new TextDecoder().decode(bytes));

const entryFault = (file: CassetteFile): string | undefined => {
  if (!file.bytes) return `${file.name}: not a regular file`;
  if (!file.name.endsWith(".json")) return `${file.name}: not a .json file`;
  return undefined;
};

/** Parses and validates each file; a file whose name is not `<id>.json` fails. */
export const parseAll = (
  files: ReadonlyArray<CassetteFile>,
  validate: (raw: unknown) => CassetteValidation
) => {
  const found: Array<CommittedCassette> = [];
  const faults: Array<string> = [];
  for (const file of files) {
    const fault = entryFault(file);
    if (fault || !file.bytes) {
      faults.push(fault ?? file.name);
      continue;
    }
    try {
      const result = validate(parseJson(file.bytes));
      if (!result.ok) {
        faults.push(`${file.name}: ${result.errors.join("; ")}`);
      } else if (file.name !== `${result.cassette.id}.json`) {
        faults.push(`${file.name}: holds cassette ${result.cassette.id}`);
      } else {
        found.push({
          cassette: result.cassette,
          digest: sha256Hex(file.bytes),
        });
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
