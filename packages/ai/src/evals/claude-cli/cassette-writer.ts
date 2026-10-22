import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sha256Hex } from "../cassettes/canonical-hash";
import { COMMITTED_DIR } from "../cassettes/cassette-files";
import type { Cassette } from "../cassettes/cassette-schema";
import { manifestSchema } from "../cassettes/manifest";
import type { Manifest } from "../cassettes/manifest";
import {
  OFFICIAL_CASSETTE_MODEL,
  OFFICIAL_SERVED_FORM,
  validateCommittedCassette,
} from "../cassettes/validate-cassette";
import type { ServedForm } from "../cassettes/validate-cassette";
import { harnessFault } from "./harness-fault";
import { committedServedFault } from "./served-model";

/** Gitignored: every recording with a model other than the official one. */
export const ITERATION_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".eval-cassettes"
);

export type CassetteTargets = {
  committedDir: string;
  iterationDir: string;
  servedForm: ServedForm | null;
};

const DEFAULT_TARGETS: CassetteTargets = {
  committedDir: COMMITTED_DIR,
  iterationDir: ITERATION_DIR,
  servedForm: OFFICIAL_SERVED_FORM,
};

/**
 * The committed directory is in `.prettierignore` as generated output, so
 * these bytes are the bytes the manifest digest covers.
 */
export const serialize = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

const upsertManifest = (dir: string, id: string, sha256: string) => {
  const path = join(dir, "manifest.json");
  const manifest: Manifest = manifestSchema.parse(
    JSON.parse(readFileSync(path, "utf8"))
  );
  const cassettes = [
    ...manifest.cassettes.filter((entry) => entry.id !== id),
    { id, sha256 },
  ].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(path, serialize({ cassettes }));
};

const writeCommitted = (cassette: Cassette, targets: CassetteTargets) => {
  const validation = validateCommittedCassette(cassette);
  if (!validation.ok) throw harnessFault(validation.errors.join("; "));
  const served = committedServedFault(
    cassette.servedModelId,
    targets.servedForm
  );
  if (served) throw harnessFault(served);
  const bytes = serialize(cassette);
  writeFileSync(join(targets.committedDir, `${cassette.id}.json`), bytes);
  upsertManifest(targets.committedDir, cassette.id, sha256Hex(bytes));
};

/**
 * Official model: the committed directory plus its manifest entry, the only
 * writer of a digest. Any other model: the iteration directory, never listed.
 * Returns the path written.
 */
export const writeCassette = (
  cassette: Cassette,
  targets: CassetteTargets = DEFAULT_TARGETS
): string => {
  if (cassette.requestedModelId === OFFICIAL_CASSETTE_MODEL) {
    writeCommitted(cassette, targets);
    return join(targets.committedDir, `${cassette.id}.json`);
  }
  mkdirSync(targets.iterationDir, { recursive: true });
  const path = join(targets.iterationDir, `${cassette.id}.json`);
  writeFileSync(path, serialize(cassette));
  return path;
};
