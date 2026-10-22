import { z } from "zod";
import type { Cassette } from "./cassette-schema";
import { UNBLOCK_PATHS } from "./replay-runner";

/** One entry per real cassette expected in the committed directory. */
export const manifestSchema = z.strictObject({
  cassettes: z.array(
    z.strictObject({
      id: z.string().min(1),
      sha256: z.string().regex(/^[0-9a-f]{64}$/, "expected a SHA-256 hex"),
    })
  ),
});

export type Manifest = z.infer<typeof manifestSchema>;

/** A cassette as found on disk, with the SHA-256 of its file bytes. */
export type CommittedCassette = { cassette: Cassette; digest: string };

export type ManifestCheck = {
  faults: Array<string>;
  /** Ids that must not be replayed: unlisted or not matching their digest. */
  rejected: Set<string>;
};

export const duplicatesOf = (ids: ReadonlyArray<string>): Array<string> => [
  ...new Set(ids.filter((id, i) => ids.indexOf(id) !== i)),
];

const push = (faults: Array<string>, label: string, ids: Array<string>) => {
  if (ids.length > 0) faults.push(label.replace("{ids}", ids.join(", ")));
};

/**
 * The manifest against what is on disk. Retiring an id is the entry and the
 * file removed together, which passes every check here; deleting only the
 * file leaves a listed id missing.
 */
export const checkManifest = (
  manifest: Manifest,
  found: ReadonlyArray<CommittedCassette>
): ManifestCheck => {
  const listed = new Map(manifest.cassettes.map((e) => [e.id, e.sha256]));
  const present = new Set(found.map((f) => f.cassette.id));
  const faults: Array<string> = [];
  const unlisted = [...present].filter((id) => !listed.has(id));
  const tampered = found
    .filter((f) => listed.has(f.cassette.id))
    .filter((f) => listed.get(f.cassette.id) !== f.digest)
    .map((f) => f.cassette.id);

  push(
    faults,
    "duplicate manifest entries: {ids}",
    duplicatesOf(manifest.cassettes.map((e) => e.id))
  );
  push(
    faults,
    `missing cassettes: {ids} — ${UNBLOCK_PATHS}`,
    [...listed.keys()].filter((id) => !present.has(id))
  );
  push(
    faults,
    "unlisted cassettes: {ids} — only the recorder writes a manifest entry",
    unlisted
  );
  push(faults, "cassettes not matching their manifest digest: {ids}", tampered);
  return { faults, rejected: new Set([...unlisted, ...tampered]) };
};
