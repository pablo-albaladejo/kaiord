// A Round-trip claim names its formats, and each named format must be one the
// round-trip validator covers, proven by that format's own contract test. A
// format without a passing Round-trip test cannot carry the claim: it is not
// in ROUND_TRIP_FORMATS (or it is in NO_ROUND_TRIP), or its test is not the
// proof, or its package has no shard in the CI `round-trip` job.

import {
  EXTENSION,
  KNOWN_EXTENSIONS,
  NO_ROUND_TRIP,
  ROUND_TRIP_FORMATS,
  ROUND_TRIP_WORD,
} from "./round-trip-formats.vocab.mjs";

const proofs = (claim) => (Array.isArray(claim.proof) ? claim.proof : []);

const provenBy = (claim, format) =>
  proofs(claim).some((p) => p.test === format.test && p.title === format.title);

// The formats a sentence names that no Round-trip test covers.
const refusedIn = (text) => [
  ...NO_ROUND_TRIP.filter((f) => f.pattern.test(text)),
  ...[...text.matchAll(EXTENSION)]
    .map((m) => m[1].toLowerCase())
    .filter((ext) => !KNOWN_EXTENSIONS.includes(ext))
    .map((ext) => ({
      format: `.${ext}`,
      reason: "it is no format the Kaiord SDK reads",
    })),
];

// A Round-trip claim naming no format speaks of every format.
const everyFormatProblems = (claim, where) =>
  ROUND_TRIP_FORMATS.filter(
    (f) => !proofs(claim).some((p) => p.test === f.test)
  ).map(
    (f) =>
      `${where}: a Round-trip claim that names no format speaks of every format, so it is proven by a test of ${f.test}`
  );

export const roundTripProblems = (claim) => {
  const text = typeof claim.text === "string" ? claim.text : "";
  if (!ROUND_TRIP_WORD.test(text)) return [];
  const where = `claim "${claim.id}"`;
  const named = ROUND_TRIP_FORMATS.filter((f) => f.pattern.test(text));
  const refused = refusedIn(text);
  if (named.length === 0 && refused.length === 0)
    return claim.kind === "label" ? [] : everyFormatProblems(claim, where);
  const problems = refused.map(
    (f) =>
      `${where}: ${f.format} has no Round-trip test (${f.reason}), so no sentence may claim a Round-trip for it`
  );
  if (claim.kind === "label" && named.length > 0)
    problems.push(`${where}: a label cannot carry a Round-trip claim`);
  for (const format of named)
    if (!provenBy(claim, format))
      problems.push(
        `${where}: a Round-trip claim for ${format.format} is proven by ${format.test} "${format.title}"`
      );
  return problems;
};

// The `package:` list of the round-trip matrix in ci.yml, or null.
const roundTripShards = (ciYaml) => {
  const job = /\n {2}round-trip:\n([\s\S]*?)\n {2}\S/.exec(`${ciYaml}\n  x`);
  const list = job && /\n\s+package:\s*\[([^\]]*)\]/.exec(job[1]);
  return list ? [...list[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : null;
};

export const roundTripCiProblems = (ciYaml) => {
  const shards = ciYaml === null ? null : roundTripShards(ciYaml);
  if (shards === null)
    return [
      ".github/workflows/ci.yml: no round-trip job with a package matrix",
    ];
  return ROUND_TRIP_FORMATS.filter((f) => !shards.includes(f.package)).map(
    (f) =>
      `.github/workflows/ci.yml: the round-trip job has no "${f.package}" shard, so the ${f.format} Round-trip test does not run in CI`
  );
};
