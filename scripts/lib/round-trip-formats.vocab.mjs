// The formats that may carry a Round-trip claim (GLOSSARY.md "Round-trip"),
// each with the test that proves it and the CI round-trip shard that runs it.
// A public sentence that says Round-trip and names a format is a claim about
// that format: `check-claims.mjs` requires its register entry to be proven by
// exactly this test, refuses it for a format listed in NO_ROUND_TRIP (the
// Kaiord SDK reads it but writes nothing back), and fails when a format here
// has no shard in the `round-trip` job of ci.yml.

const contractTest = (pkg) =>
  `packages/${pkg}/src/adapters/round-trip/round-trip-contract.test.ts`;

const title = (name) =>
  `should keep every value of every ${name} workout within the declared tolerances`;

export const ROUND_TRIP_FORMATS = [
  { format: "FIT", pattern: /\bFIT\b/, package: "fit" },
  { format: "TCX", pattern: /\bTCX\b/, package: "tcx" },
  { format: "ZWO", pattern: /\bZWO\b|\bZwift\b/, package: "zwo" },
  {
    format: "GCN",
    pattern: /\bGCN\b|\bGarmin Connect\b/,
    package: "garmin",
  },
].map((f) => ({ ...f, test: contractTest(f.package), title: title(f.format) }));

export const NO_ROUND_TRIP = [
  { format: "WHOOP", pattern: /\bWHOOP\b/i },
  { format: "Tanita", pattern: /\bTanita\b|\bMyTANITA\b/i },
  { format: "TrainingPeaks", pattern: /\bTrainingPeaks\b/i },
  { format: "Train2Go", pattern: /\bTrain2Go\b/i },
];

// The word that makes a sentence a Round-trip claim, in English and Spanish.
export const ROUND_TRIP_WORD = /\bround[- ]?trip|\bida y vuelta\b/i;
