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
const WITHDRAWN = `${RETIRED}: say Round-trip, per format, within the declared tolerances, proven by that format's Round-trip test (#1654)`;

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

// Words the athlete never reads (GLOSSARY.md, "Bridge"): each extension is
// "Kaiord for" its Platform, and "extension" when a noun is needed. Checked on
// every athlete-facing text: the App's dictionaries and UI copy, the
// extensions' _locales and popups, every registered claims surface (store
// listings, privacy policy, landing, docs intros, READMEs) and ATHLETE_FILES.
// Code identifiers, package names, file names and developer docs keep
// "bridge"; where a page shows one of them, ATHLETE_ALLOWED names it.
const BRIDGE_WORD =
  'GLOSSARY.md, "Bridge": the athlete reads "Kaiord for <Platform>", or "extension"';

// GLOSSARY.md, "Capability": the athlete reads "Feature" ("Función"); the
// code and internal docs keep "Capability".
const CAPABILITY_WORD =
  'GLOSSARY.md, "Capability": the athlete reads "Feature", Spanish "Función"';

export const ATHLETE_TERMS = [
  { term: "bridge", pattern: /\bbridges?\b/i, why: BRIDGE_WORD },
  {
    term: "Capability",
    pattern: /\bcapabilit(?:y|ies)\b|\bcapacidad(?:es)?\b/i,
    why: CAPABILITY_WORD,
  },
  {
    term: "the Kaiord extension",
    pattern:
      /\bKaiord extensions?\b|\bextensi[oó]n(?:es)? (?:de )?Kaiord\b(?! for)/i,
    why: `${BRIDGE_WORD}; there are five extensions, so name its Platform`,
  },
];

const DECLARED_TOKENS =
  "an extension's declared data capabilities (`read:body`, `write:body`…), the wire tokens it announces, not a Feature of the Kaiord App";
const PHYSIOLOGY =
  "a zone named for a physiological capacity (aerobic, anaerobic), not a Feature of the Kaiord App";

const PACKAGE_NAME = "the npm package name, shown where a page names the code";
const STORE_ADDRESS =
  "the published listing's address: the Chrome Web Store keeps the slug it gave at first publication, and the link must keep working";

export const ATHLETE_ALLOWED = [
  ...["garmin", "train2go", "tanita", "trainingpeaks", "whoop"].map((p) => ({
    phrase: `@kaiord/${p}-bridge`,
    why: PACKAGE_NAME,
  })),
  {
    phrase:
      "chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe",
    why: STORE_ADDRESS,
  },
  ...["tanita", "trainingpeaks", "whoop"].map((p) => ({
    phrase: `github.com/pablo-albaladejo/kaiord/tree/main/packages/${p}-bridge`,
    why: "the source folder an unpublished extension is loaded from",
  })),
  ...[
    "posting its id, version and capabilities to the page",
    "using the `write:body` capability",
    "Only the `read:body` capability is declared",
    "These are the `read:body`, `write:body` and `write:workouts` capabilities",
    "declaring the `read:body`, `read:sleep`, and `read:activities` capabilities",
    "its declared capabilities",
  ].map((phrase) => ({ phrase, why: DECLARED_TOKENS })),
  ...["Capacidad aeróbica", "Capacidad anaeróbica"].map((phrase) => ({
    phrase,
    why: PHYSIOLOGY,
  })),
  {
    phrase: "Failed to record a Capability decision",
    why: "a developer log line (logger.warn), never shown to the athlete",
  },
];

// Athlete-facing files read whole, or only in the named sections, beyond the
// registered surfaces and the texts check-connection-notices.mjs collects (App
// dictionaries and UI literals, the extensions' _locales and popup.js
// strings). popup.html is not here: it holds no words of its own
// (R-BridgeLocalesEnglishSpanish), so its text is its _locales. Each store
// listing's name is read here; WHOOP's descriptions too, since its listing is
// not yet a claims surface (it is unpublished).
const LISTING = (p) => `packages/${p}-bridge/store-listing.md`;

export const ATHLETE_FILES = [
  ...["garmin", "train2go", "tanita", "trainingpeaks"].map((p) => ({
    file: LISTING(p),
    sections: ["Extension Name"],
  })),
  {
    file: LISTING("whoop"),
    sections: [
      "Extension Name",
      "Short Description (132 chars max)",
      "Detailed Description",
      "Short Description, Spanish (132 chars max)",
      "Detailed Description, Spanish",
    ],
  },
  "packages/docs/legal/privacy-policy.md",
  "packages/docs/guide/install-extensions.md",
  "packages/docs/es/guide/install-extensions.md",
  "packages/docs/guide/whoop-recovery-in-plan.md",
  "packages/docs/es/guide/whoop-recovery-in-plan.md",
  "packages/docs/guide/kaiord-vs-trainingpeaks-intervals-garmin.md",
  "packages/docs/es/guide/kaiord-vs-trainingpeaks-intervals-garmin.md",
  "packages/docs/convert/fit-to-garmin.md",
  "packages/docs/convert/tcx-to-garmin.md",
  "packages/docs/convert/zwo-to-garmin.md",
];
