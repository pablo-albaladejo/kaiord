// The formats that may carry a Round-trip claim (GLOSSARY.md "Round-trip"),
// each with the test that proves it and the CI round-trip shard that runs it.
// A public sentence that says Round-trip (or lossless, or that every value
// is kept) and names a format is a claim about that format:
// `check-claims.mjs` requires its register entry to be proven by exactly this
// test, refuses it for a format listed in NO_ROUND_TRIP, and fails when a
// format here has no shard in the `round-trip` job of ci.yml. Formats are
// matched in any case, by name, common name or file extension.

const contractTest = (pkg) =>
  `packages/${pkg}/src/adapters/round-trip/round-trip-contract.test.ts`;

const title = (name) =>
  `should keep every value of every ${name} workout within the declared tolerances`;

export const ROUND_TRIP_FORMATS = [
  { format: "FIT", pattern: /\bfit\b/i, package: "fit" },
  { format: "TCX", pattern: /\btcx\b|\btraining center\b/i, package: "tcx" },
  { format: "ZWO", pattern: /\bzwo\b|\bzwift\b/i, package: "zwo" },
  {
    format: "GCN",
    pattern: /\bgcn\b|\bgarmin[ -]?connect\b/i,
    package: "garmin",
  },
].map((f) => ({ ...f, test: contractTest(f.package), title: title(f.format) }));

const READ_ONLY = "the Kaiord SDK reads it but writes nothing back";
const NOT_WRITTEN = "the Kaiord SDK has no reader and writer for it";
const NO_CONTRACT =
  "KRD is the model every Round-trip goes through, and no contract test round-trips KRD JSON itself";

// Formats no Round-trip test covers: no sentence may claim one for them.
export const NO_ROUND_TRIP = [
  { format: "WHOOP", pattern: /\bwhoop\b/i, reason: READ_ONLY },
  { format: "Tanita", pattern: /\b(?:my)?tanita\b/i, reason: READ_ONLY },
  { format: "TrainingPeaks", pattern: /\btrainingpeaks\b/i, reason: READ_ONLY },
  { format: "Train2Go", pattern: /\btrain2go\b/i, reason: READ_ONLY },
  { format: "ERG", pattern: /\berg\b/i, reason: NOT_WRITTEN },
  { format: "MRC", pattern: /\bmrc\b/i, reason: NOT_WRITTEN },
  {
    format: "KRD JSON",
    pattern: /\bkrd[- ]json\b|\.krd\b/i,
    reason: NO_CONTRACT,
  },
];

// File extensions the lists above name; any other one is an unknown format.
export const KNOWN_EXTENSIONS = [
  "fit",
  "tcx",
  "zwo",
  "gcn",
  "krd",
  "erg",
  "mrc",
];
export const EXTENSION = /(?:^|[\s(,/])\.([a-z0-9]{2,5})\b/gi;

// The words that make a sentence a Round-trip claim, in English and Spanish:
// Round-trip itself and the lossless-like phrasings GLOSSARY.md avoids.
export const ROUND_TRIP_WORD =
  /\bround[- ]?trip|\bida y vuelta\b|\blossless\b|\b(?:zero|no) data loss\b|\bwithout (?:any )?(?:data )?loss\b|\bkeeps? every value\b|\bsin p[eé]rdidas?\b|\bconserva todos los valores\b/i;
