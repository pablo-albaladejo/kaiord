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
  paragraph changes nothing. Front matter and `<!-- comments -->` are not shown
  to a reader and are ignored.
- JSON locale files (`_locales/*/messages.json`): the `message` of each key
  the surface names.

There are no markers to forget: a sentence added to a surface without an entry
fails the guard, and so does an edit to a registered sentence, because its
text no longer matches. An entry whose text is on none of its surfaces fails
too (delete it), and so does a proof that no longer exists.

## A register file

One JSON file per group of surfaces (`garmin.json`, later `landing.json`, …),
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
units. A missing section or key fails; it never registers an empty surface.

## Proofs

Each claim has at least one. Unknown fields are refused, so a typo cannot pass.

| Kind     | Shape                                     | Holds while                                                                                         |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| File     | `{ "file": "path", "contains": "text" }`  | the file exists and, if `contains` is given, still holds that exact text (prefer pinning the code). |
| Test     | `{ "test": "path", "title": "should …" }` | the file has a running `it("…")` / `test("…")` with that exact title; `it.skip` proves nothing.     |
| Endpoint | `{ "endpoint": "https://…" }`             | it is an https URL. A `kaiord.com` URL also names `servedBy`, the repo file that serves it.         |

Endpoints are not fetched: the guard stays hermetic. Paths are repo-relative.
A heading or label that states nothing ("What it does:") may point to the
surface file itself; anything that states a fact points to the code or test
that makes it true. A proof that only exists is the floor, not the bar: the
reviewer still checks that it proves the sentence.

## Adding a surface (what a later ticket does)

1. Write the text from what the code does.
2. Add the surface to a register file: a new `claims/<group>.json` for a new
   group (for example `claims/landing.json`), or a `surfaces` entry in an
   existing one. Choose `sections` or `keys` when only part of the file is
   public.
3. Run `pnpm lint:claims`. It lists each unit with no entry as
   `<file>: unregistered claim "<text>"`; that quoted text is the exact
   `text` to register.
4. For each one, add `{ "id", "text", "proof" }`. Ids are dotted and unique
   across all files (`landing.backend.none`). If no proof exists, write the
   test that proves it, or remove the sentence.
5. Run `pnpm lint:claims` and `node --test scripts/check-claims.test.mjs`.

Changing a registered sentence is the same loop: edit the text, run the
guard, update the entry's `text` and, if the meaning changed, its proof.

## Registered today

| File                 | Surfaces                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `garmin.json`        | Kaiord for Garmin: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1625)        |
| `tanita.json`        | Kaiord for Tanita: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1627)        |
| `train2go.json`      | Kaiord for Train2Go: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1626)      |
| `trainingpeaks.json` | Kaiord for TrainingPeaks: `extDescription`, store listing (Short and Detailed Description), `privacy-justification.md`, its privacy-policy section (#1628) |
