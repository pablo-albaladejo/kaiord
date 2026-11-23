/**
 * Where the i18n guard runs, and what it lets through.
 *
 * `local/no-jsx-literal-text` runs on every component of the Kaiord App, and
 * `local/no-literal-copy` on every source file of the App that builds copy
 * outside JSX. Both skip the code that never reaches the athlete:
 *
 * - tests, stories and test helpers render fixtures, not copy;
 * - `application/**` holds pure use cases, which may not import the
 *   translator (R-ArchAppPure); the presentation layer words their results;
 * - `store/**` returns diagnostic results that a hook words before showing;
 * - `types/**` holds schema refinements read by developers, not athletes;
 * - `adapters/dexie/**` holds frozen migrations, whose seeded rows are data;
 * - `i18n/**` is the mechanism itself;
 * - a chat tool's error result is read by the model, which words it for
 *   the athlete in their language; it is the tool's contract, not copy.
 */

const SPA = "packages/workout-spa-editor/src";

export const JSX_LITERAL_FILES = [`${SPA}/**/*.tsx`];

export const LITERAL_COPY_FILES = [`${SPA}/**/*.ts`, `${SPA}/**/*.tsx`];

const NEVER_COPY = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.stories.tsx",
  "**/*.test-helpers.ts",
  "**/*.test-fixtures.ts",
  "**/test-helpers.ts",
  "**/test-fixtures.ts",
  "test-utils/**",
  "test-utils.tsx",
  "test-setup.ts",
  "test-fixtures/**",
  "__perf__/**",
  "__regressions__/**",
];

export const JSX_LITERAL_IGNORES = NEVER_COPY.map((glob) => `${SPA}/${glob}`);

export const LITERAL_COPY_IGNORES = [
  ...JSX_LITERAL_IGNORES,
  ...["application", "store", "types", "adapters/dexie", "i18n"].map(
    (dir) => `${SPA}/${dir}/**`
  ),
];

/**
 * Copy that is the same in every language: the product and Platform names,
 * the Provider names, the shared file types, an API-key shape, units, the
 * zone prefix ("Z3"), the remove glyph, a time format, the operating
 * systems of the shortcut sheet, and the threshold acronyms ("LTHR", "FTP",
 * "HRV") that coaches use untranslated.
 */
export const JSX_LITERAL_ALLOW = [
  "Kaiord Editor",
  "Train2Go",
  "Anthropic (Claude)",
  "OpenAI (GPT)",
  "Google (Gemini)",
  "FIT",
  "TCX",
  "ZWO",
  "ZWO (Zwift)",
  "Garmin Connect",
  "sk-...",
  "kcal",
  "ms",
  "W",
  "Z",
  "x",
  "mm:ss",
  "macOS",
  "Windows / Linux",
  "LTHR",
  "FTP",
  "HRV",
];

/**
 * Words allowed on one surface only. The single letters are keyboard keys,
 * read on the shortcut sheet (the context menu takes them from its
 * catalog). KRD and GCN are formats, which appear only as file types on
 * import and export (ADR 0003).
 */
export const SCOPED_ALLOW = [
  {
    files: [
      `${SPA}/components/organisms/ShortcutSheet/**`,
      `${SPA}/components/atoms/KeyChips/**`,
      `${SPA}/constants/shortcut-*.ts`,
    ],
    allow: ["A", "C", "G", "V", "X"],
  },
  {
    files: [
      `${SPA}/components/molecules/ExportFormatSelector/**`,
      `${SPA}/components/molecules/FileUpload/**`,
      `${SPA}/components/pages/ConvertPage/**`,
    ],
    allow: ["KRD", "GCN"],
  },
];
