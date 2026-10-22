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

const idsNotIn = (ids: Array<string>, among: Set<string>): Array<string> =>
  ids.filter((id) => !among.has(id));

/**
 * The manifest against what is on disk. Only real cassettes are pinned: a
 * synthetic fixture is never measured, so it needs no entry. Retiring an id
 * is the entry and the file removed together, which passes every check here.
 */
export const manifestFaults = (
  manifest: Manifest,
  found: ReadonlyArray<CommittedCassette>
): Array<string> => {
  const real = found.filter((f) => f.cassette.recorder === "claude-cli");
  const listed = new Map(manifest.cassettes.map((e) => [e.id, e.sha256]));
  const present = new Set(real.map((f) => f.cassette.id));
  const faults: Array<string> = [];

  const missing = idsNotIn([...listed.keys()], present);
  if (missing.length > 0) {
    faults.push(`missing cassettes: ${missing.join(", ")} — ${UNBLOCK_PATHS}`);
  }
  const unlisted = idsNotIn([...present], new Set(listed.keys()));
  if (unlisted.length > 0) {
    faults.push(
      `unlisted cassettes: ${unlisted.join(", ")} — only the recorder writes a manifest entry`
    );
  }
  const tampered = real
    .filter((f) => listed.has(f.cassette.id))
    .filter((f) => listed.get(f.cassette.id) !== f.digest)
    .map((f) => f.cassette.id);
  if (tampered.length > 0) {
    faults.push(
      `cassettes not matching their manifest digest: ${tampered.join(", ")}`
    );
  }
  return faults;
};
