# Claims register

Every public claim Kaiord makes points to its proof. This directory is the
register; `scripts/check-claims.mjs` (`pnpm lint:claims`, part of `pnpm lint`)
is the guard. An unproven claim is removed, not kept for the look of the pitch.

## How a sentence is tied to its entry

A registered surface is a file, or some sections of one. **Every unit of text
a reader sees on it is a claim**, and must equal the `text` of an entry in the
same register file:

- Markdown: each heading, list item (with its indented continuation), table
  row and paragraph is one unit. Whitespace is collapsed, so re-wrapping a
  paragraph changes nothing; a `>` quote marker is not text. A unit that holds
  HTML tags is read as HTML (below). Front matter, `<!-- comments -->` and
  `<script>` / `<style>` blocks are not shown to a reader and are ignored.
- HTML pages (`*.html`): each run of text between tags, in document order,
  plus each text alternative or field text (`aria-label`, `aria-description`,
  `alt`, `title`, `placeholder`) and each text a search result or a link
  preview shows (`<title>`, the `description` and `keywords` metas, `og:*`
  and `twitter:*` text metas). A `<pre>` code example is one unit. From the
  JSON-LD, every string a search engine shows (`name`, `description`, an
  answer's `text`, `headline`, `featureList`…; not ids, URLs, types, dates or
  prices) is a unit. Other scripts, styles and comments are dropped. A unit
  holds a letter or a digit: a lone `·` is not a claim, a lone `5` is. Text
  split by an inline tag is two units (`Built by` and `Pablo Albaladejo`), so
  keep a claim inside one element.
- JSON files with `keys`: the text at each key, a string or the `message` of
  an object (the shape of `_locales/*/messages.json`). A dotted key walks
  into nested objects (`es.title` in `packages/landing/i18n/meta.json`).
- JSON files without `keys`: every string value, never the object keys. This
  is a translation file (`packages/landing/i18n/es.json` maps the English
  source text to the Spanish a reader sees).

There are no markers to forget: a sentence added to a surface without an entry
fails the guard, and so does an edit to a registered sentence, because its
text no longer matches. An entry whose text is on none of its surfaces fails
too (delete it), and so does a proof that no longer holds.

Texts are counted, not only matched: a text must appear on the register's
surfaces exactly as many times as the register has entries for it. When it is
the same claim each time (a page title repeated in `og:title` and
`twitter:title`), the entry says so with `"count": 3`; when it is a different
claim that happens to read the same (a second "5"), it gets its own entry and
proof. So a short unit added again cannot ride on the first one's proof.

## A register file

One JSON file per group of surfaces (`garmin.json`, `landing.json`, …),
so tickets working in parallel edit different files. A claim id, a whole file,
and each section or key of a file belong to one register file only; different
sections of one file (the privacy policy's per-extension sections) may sit in
different register files.

```json
{
  "surfaces": [
    { "file": "packages/garmin-bridge/privacy-justification.md" },
    {
      "file": "packages/garmin-bridge/store-listing.md",
      "sections": ["Detailed Description"]
    },
    {
      "file": "packages/garmin-bridge/_locales/en/messages.json",
      "keys": ["extDescription"]
    }
  ],
  "claims": [
    {
      "id": "garmin.tokens.local-never-kaiord",
      "text": "The Garmin tokens are kept in your browser (chrome.storage.local) and are sent only to Garmin. They never travel to Kaiord.",
      "proof": [
        {
          "test": "packages/garmin-bridge/test/token-confinement.test.js",
          "title": "should answer no external action with a token, when Garmin answers"
        }
      ]
    }
  ]
}
```

`sections` names headings by their exact text (any level); a section runs to
the next heading of the same or a higher level, and its own sub-headings are
units. `"intro": true` adds the H1 and its lead (everything before the first
sub-heading), which no section can select without taking the whole file: a
README's pitch, without its install and API reference. A missing section or key fails; it never registers an empty surface.

## Kinds of entry

| Kind                 | Shape                                                              | Needs                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Claim (no `kind`)    | `{ "id", "text", "proof": [...], "count"? }`                       | at least one proof, and one that says what the sentence says: a running test, or a `contains` pin of 16+ characters in a file that is not one of the register's surfaces |
| `"kind": "label"`    | `{ "id", "text", "kind": "label", "count"? }`                      | nothing: text with no factual content (a heading, a button, a navigation link, a question, sample data in a mock). It carries no proof                                   |
| `"kind": "external"` | `{ "id", "text", "kind": "external", "url", "read_on", "proof"? }` | the https `url` read and the ISO date `read_on`; it fails 180 days after that date, so the source is read again                                                          |

A label states nothing; if in doubt, it is a claim. An external claim
restates a third party (a Platform's terms, Chrome's documented behaviour)
that no test here can check. A claim proven only by its own surface, a file
existing or an endpoint fails: prove it, declare it, or remove the sentence.
`pnpm lint:claims` prints one line with how many claims, labels and external
claims there are and how many are proven by test and by pinned code. Counts
("4 formats", "5 extensions") are proven by a test that counts.

## Proofs

Unknown fields are refused, so a typo cannot pass.

| Kind     | Shape                                     | Holds while                                                                                                                                                                                                |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File     | `{ "file": "path", "contains": "text" }`  | the file exists and, if `contains` is given, still holds that exact text (prefer pinning the code).                                                                                                        |
| Test     | `{ "test": "path", "title": "should …" }` | the file has an `it("…")` / `test("…")` call with that exact title in code (not a comment or a string), and neither it nor a `describe` around it is skipped, todo, conditional or left out by an `.only`. |
| Endpoint | `{ "endpoint": "https://…" }`             | it is an https URL. A `kaiord.com` URL also names `servedBy`, the repo file that serves it.                                                                                                                |

Endpoints are not fetched: the guard stays hermetic. Paths are repo-relative.
A proof that holds is the floor, not the bar: the reviewer still checks that
it proves the sentence.

## Adding a surface (what a later ticket does)

1. Write the text from what the code does.
2. Add the surface to a register file: a new `claims/<group>.json` for a new
   group (for example `claims/landing.json`), or a `surfaces` entry in an
   existing one. Choose `sections` or `keys` when only part of the file is
   public.
3. Run `pnpm lint:claims`. It lists each unit with no entry as
   `<file>: unregistered claim "<text>"`; that quoted text is the exact
   `text` to register.
4. For each one, add `{ "id", "text", "proof" }`, or a label or external
   entry. Ids are dotted and unique across all files (`landing.backend.none`).
   If no proof exists, write the test that proves it, or remove the sentence.
5. Run `pnpm lint:claims` and `node --test scripts/check-claims.test.mjs`.

Changing a registered sentence is the same loop: edit the text, run the
guard, update the entry's `text` and, if the meaning changed, its proof.

## Registered today

| File                   | Surfaces                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.json`             | The Kaiord App page `packages/workout-spa-editor/index.html`: title, metas, JSON-LD and the `<noscript>` text                                                                                                                                |
| `docs.json`            | The docs home and getting-started intros, the converters page's "Three ways to convert", and `packages/landing/public/llms.txt`                                                                                                              |
| `garmin.json`          | Kaiord for Garmin: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1625)                                                                                          |
| `landing.json`         | The landing, English and Spanish: `packages/landing/index.html` (with its head and text alternatives), `partials/phone-screen.html`, every translation in `i18n/es.json`, and the Spanish title and descriptions in `i18n/meta.json` (#1630) |
| `method.json`          | The method note `packages/docs/project/how-kaiord-is-built.md`, which quotes the landing headline as `method.headline` (#1632)                                                                                                               |
| `platform-access.json` | The public register of unofficial access per Platform, `packages/docs/legal/platform-access.md` (#1631)                                                                                                                                      |
| `readme.json`          | The root `README.md` (intro, Features, Local-first architecture) and the intro of each published package's README (core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp, ai), of the five extensions, of the App and of the landing (#1630) |
| `tanita.json`          | Kaiord for Tanita: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1627)                                                                                          |
| `train2go.json`        | Kaiord for Train2Go: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1626)                                                                                        |
| `trainingpeaks.json`   | Kaiord for TrainingPeaks: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1628)                                                                                   |

The landing headline "Every line — … written by AI agents." is proven by the
method note: the landing's entries for that sentence, `landing.en.ai.headline`
and `landing.es.ai.headline`, point to the note and to
`scripts/check-method-figures.test.mjs`. The note's figures are rerun by
`pnpm lint:method-figures`.

Scoped out of `readme.json`, as reference rather than pitch: install
commands, usage and API sections, configuration, the per-format "Supported …
Features" lists and the root README's FIT reference (each is a per-format
capability claim the round-trip work of #1654 proves format by format), and
the root README's documentation, tech-stack, layout, CI and contributing
sections. Scoped out of `docs.json`: the converters page's per-format "What
survives a conversion?" list (the same #1654 work). The JSON-LD in the
landing's `<head>` is read: its FAQ questions and answers repeat the visible
FAQ (those entries say `"count": 2`), and its five `description` strings are
entries of their own (`landing.jsonld.*`).

Words GLOSSARY.md retired or withdrew are held off every registered surface,
and off a few non-prose files, by `scripts/check-retired-terms.mjs`
(`pnpm lint:retired-terms`); the list is `scripts/retired-terms.vocab.mjs`.
