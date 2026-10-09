> Completed: 2026-09-28

# Proposal: Converter deep link and athlete guides

## Why

The twelve converter pages in the docs sent readers to `kaiord.com/app/`,
which opens the calendar: the reader had to find the import dialog, and the
import then replaced whatever workout was open in the editor. Nothing in the
docs said that the converters handle structured workouts, not recorded
activities, which is the most common reason a conversion "does not work".

The docs had no content for athletes: every guide was for developers
(quick start, architecture, testing). Nothing was in Spanish, although the
landing page already is.

## What Changes

- SPA: a `/convert` route read from the fragment query
  (`#/convert?from=<fit|tcx|zwo|gcn|garmin>&to=<fit|tcx|zwo|gcn|krd>`). It
  converts one file with local state and a download: it never writes the
  editor's workout store and never persists anything. Invalid or missing
  parameters render a format picker. The page is lazy and listed in
  `FORBIDDEN_LAZY_SOURCES` so the initial-JS budget holds.
- Docs: each converter page opens with a scope callout and links its own
  deep link; the converters index gains "Workouts vs. activities". Three
  athlete guides in English and Spanish (`guide/<slug>` and
  `es/guide/<slug>`): AI planning with your own key, WHOOP recovery in the
  plan, and a sourced comparison with TrainingPeaks, intervals.icu and
  Garmin Connect. The Zwift-to-Garmin guide is deferred to issue #1279 (the
  Garmin writer stores % FTP power as watts); the ZWO/FIT to Garmin pages
  state that known issue.
- Docs i18n: an `es` locale whose root is a real page (`es/index.md`),
  `i18nRouting: false` so the language switcher never links a missing
  `/es/<path>`, and hreflang en/es/x-default on the three pairs from
  `HREFLANG_PAIRS` in `indexing.mjs`.
- Guards: `check-site-links` checks the switcher anchors and, under
  `REQUIRE_DOCS_DIST=1`, fails when a docs page renders none;
  `dist-no-placeholders.test.mjs` fails if `CONFIRMAR` ships in a page, a
  `.md` mirror or `llms-full.txt`; the dist
  uniqueness test checks `<html lang>` and hreflang per page;
  `indexing.test.mjs` checks every pair exists on disk; cspell checks `es/**`
  with a Spanish dictionary.
- Landing: a guides block (ES page links the ES guides through
  `data-es-href`) and the guides in `llms.txt`.

## Impact

- Affected specs: `spa-routing` (ADDED "Converter deep link route"),
  `docs-site` (MODIFIED "Manual guides", ADDED "ES locale for guides with
  hreflang"), `landing-page` (ADDED "Guides linked").
- Rollback: revert; `#/convert` links then fall to the catch-all redirect to
  the calendar.
