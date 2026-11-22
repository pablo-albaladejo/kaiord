// The retired and withdrawn words of GLOSSARY.md, the one list
// `check-retired-terms.mjs` reads. Each term has its pattern (English and
// Spanish) and the reason it is retired. ALLOWED holds the exact phrases
// where a term is used legitimately, each with its reason; a phrase is
// removed from the text before the terms are matched.
//
// FILES are public texts that are not prose surfaces of the claims register
// (code that ships a sentence, a package manifest, a config): the guard reads
// them whole. Every surface registered in claims/*.json is read unit by unit.

const RETIRED = "retired by GLOSSARY.md";
const WITHDRAWN =
  "withdrawn until the round-trip validator covers every format (#1654)";

export const TERMS = [
  {
    term: "framework",
    pattern: /\bframeworks?\b/i,
    why: `${RETIRED}: Kaiord is the Kaiord SDK and the Kaiord App`,
  },
  {
    term: "cockpit",
    pattern: /\bcockpit\b/i,
    why: `${RETIRED}: say Kaiord App`,
  },
  {
    term: "lossless",
    pattern: /\blossless\b|\bsin p[ée]rdidas?\b/i,
    why: WITHDRAWN,
  },
  {
    term: "zero data loss",
    pattern: /\bzero data loss\b|\bcero p[ée]rdida de datos\b/i,
    why: WITHDRAWN,
  },
  {
    term: "round-trip safe",
    pattern: /\bround[- ]trip[- ]safe\b/i,
    why: WITHDRAWN,
  },
  {
    term: "open standard",
    pattern: /\bopen standards?\b|\best[áa]ndar(?:es)? abiertos?\b/i,
    why: `${RETIRED}: KRD is an internal model, not a standard`,
  },
  {
    term: "interchange format",
    pattern: /\binterchange formats?\b|\bformatos? de intercambio\b/i,
    why: `${RETIRED}: KRD is an internal model`,
  },
  {
    term: "platform (for Kaiord itself)",
    pattern:
      /\bKaiord(?:'s)? (?:[\w-]+ )?platform\b|\bKaiord is (?:a|an|the) (?:[\w-]+ ){0,3}platform\b|\bplataforma (?:de )?Kaiord\b|\bKaiord es una (?:[\w-]+ ){0,3}plataforma\b/i,
    why: `${RETIRED}: a Platform is Garmin, WHOOP or another external service, never Kaiord`,
  },
];

export const ALLOWED = [];

export const FILES = [
  "packages/docs/index.md",
  "packages/docs/.vitepress/config.ts",
  "packages/docs/guide/getting-started.md",
  "packages/docs/convert/index.md",
  "packages/docs/formats/krd.md",
  "packages/docs/guide/why-kaiord.md",
  "packages/mcp/src/server/instructions.ts",
  "packages/garmin-connect/package.json",
];
