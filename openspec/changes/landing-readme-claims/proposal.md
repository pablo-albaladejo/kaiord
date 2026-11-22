## Why

Review of 2026-11-22, issue #1630 (parent #1670, "Only what is real is said",
stories 57, 64, 66–68). The landing said "0 Backend services", "No servers"
and "Nothing leaves your device", while two Cloudflare Workers run under
kaiord.com and the App sends data to the athlete's AI provider, Platforms and
Drive. It said every conversion is "lossless and round-trip safe", which no
test proves for TCX, ZWO or GCN. It said the assistant reshuffles the week and
pulls activities (it has no such Tool), that the CLI is pipe-friendly (it
reads no stdin), and its code example imported `fromBinary` from a package
that does not export it. The READMEs called Kaiord a "framework"; the landing
a "training platform" and a "cockpit".

## What Changes

- **Guard reads the landing.** `check-claims` reads HTML pages (text nodes,
  `aria-label`/`alt`/`title`, `<title>` and the description, `og:*` and
  `twitter:*` metas, a `<pre>` as one unit), translation files (every string
  value of a JSON file with no `keys`), dotted `keys` into nested JSON
  (`es.title`), and `intro` (a Markdown file's H1 and lead).
- **Landing registered.** `claims/landing.json` registers `index.html`, the
  phone partial, `i18n/es.json` and the Spanish metas: 297 claims, English and
  Spanish, each with its proof. The copy is rewritten from the code: the data
  statement, Kaiord App and Kaiord SDK, KRD as the SDK's internal model, the
  assistant's real Tools, counts that a file or test proves (4 formats, 5
  extensions, 56 lab parameters). A new CLI test runs the landing's code
  example as published. The headline "Every line written by AI agents" is
  untouched (#1632 gives it its proof).
- **READMEs registered.** `claims/readme.json` registers the root README's
  intro, Features and Local-first architecture, and the intro of every
  published package README. "Framework" gives way to "Kaiord SDK" in the
  READMEs and the npm descriptions; "lossless" and "works offline" are gone.
- **Kept consistent, not registered.** The JSON-LD, `llms.txt`, the 404 page
  and the Open Graph card say the same as the visible copy.
- **Inventory freshness.** A landing test fails when `i18n/en-strings.json`
  no longer equals the copy `index.html` shows, so `es.json` cannot drift.

## Capabilities

### New Capabilities

- `public-claims`: HTML, translation-file and intro surfaces; the landing and
  the READMEs are registered surfaces.

### Modified Capabilities

- `landing-page`: navigation CTA, hero, showcase, format section, developer
  section, data statement and open-source stats follow the register.

## Impact

- `scripts/` (guard, two new `lib/` readers, tests), `claims/`,
  `scripts/build-brand-images.mjs` and the regenerated `og-image.png`.
- `@kaiord/landing` (private): copy, translations, inventory test, llms.txt.
- Published packages: README and `package.json` description text only
  (patch changeset); `@kaiord/cli` gains a test.
- Out of scope: the docs site (its home still says "framework"), the MCP
  server's instructions string, the per-format "Supported … Features" README
  lists (proven per format by #1654), other public pages.
