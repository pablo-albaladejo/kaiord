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
import { harnessFault, isHarnessFault, messageOf } from "./harness-fault";
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

/** Read and validated first: a bad manifest leaves no unlisted cassette. */
const readManifest = (dir: string): Manifest =>
  manifestSchema.parse(
    JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"))
  );

const upserted = (manifest: Manifest, id: string, sha256: string) => ({
  cassettes: [
    ...manifest.cassettes.filter((entry) => entry.id !== id),
    { id, sha256 },
  ].sort((a, b) => a.id.localeCompare(b.id)),
});

const writeCommitted = (cassette: Cassette, targets: CassetteTargets) => {
  const validation = validateCommittedCassette(cassette);
  if (!validation.ok) throw harnessFault(validation.errors.join("; "));
  const served = committedServedFault(
    cassette.servedModelId,
    targets.servedForm
  );
  if (served) throw harnessFault(served);
  const manifest = readManifest(targets.committedDir);
  const bytes = serialize(cassette);
  const path = join(targets.committedDir, `${cassette.id}.json`);
  writeFileSync(path, bytes);
  writeFileSync(
    join(targets.committedDir, "manifest.json"),
    serialize(upserted(manifest, cassette.id, sha256Hex(bytes)))
  );
  return path;
};

const writeIteration = (cassette: Cassette, targets: CassetteTargets) => {
  mkdirSync(targets.iterationDir, { recursive: true });
  const path = join(targets.iterationDir, `${cassette.id}.json`);
  writeFileSync(path, serialize(cassette));
  return path;
};

/**
 * Official model: the committed directory plus its manifest entry, the only
 * writer of a digest. Any other model: the iteration directory, never listed.
 * Returns the path written. Every failure is a harness fault.
 */
export const writeCassette = (
  cassette: Cassette,
  targets: CassetteTargets = DEFAULT_TARGETS
): string => {
  try {
    return cassette.requestedModelId === OFFICIAL_CASSETTE_MODEL
      ? writeCommitted(cassette, targets)
      : writeIteration(cassette, targets);
  } catch (error) {
    // A disk or manifest failure is the harness's, never the case's.
    if (isHarnessFault(error)) throw error;
    throw harnessFault(
      `could not write cassette ${cassette.id}: ${messageOf(error)}`
    );
  }
};
