## Context

`check-claims` (#1625) read Markdown and Chrome locale files. The landing is a
hand-written `index.html` with an include, a Spanish translation map
(`i18n/es.json`, English source text → Spanish) and a nested meta file. Root
scripts take no heavy dependencies (`scripts/AGENTS.md`), so the guard cannot
borrow the landing's `node-html-parser`.

## Decisions

- **D1: units are text nodes, read by string scanning.** The same granularity
  as the landing's own i18n walker, so an English unit and its Spanish
  translation are one-to-one and share one proof. Text split by an inline
  tag is two units; the copy keeps each claim inside one element. A unit
  must hold a letter or a digit: "·" is not a claim, "5" is.
  _Rejected:_ block-level units (merging inline children). They do not match
  the translation keys, so the Spanish page could not be registered unit for
  unit.
- **D2: what a reader is shown counts, scripts do not.** Text alternatives
  and the shown metas are units; `<script>` (the JSON-LD included), `<style>`
  and comments are not. The JSON-LD repeats the visible FAQ and is kept in
  step by hand.
- **D3: a code example is one claim**, proven by a test that runs it
  (`packages/cli/src/tests/landing-code-example.test.ts`).
- **D4: the Spanish page is registered through its source files**, not the
  build output, so `pnpm lint` needs no build. A landing test keeps
  `en-strings.json` equal to what `index.html` shows, so every English string
  on the Spanish page has a translation in the registered `es.json`.
- **D5: `intro`** selects a README's H1 and lead, which no heading can
  select without the whole file. Install, usage, API and the per-format
  feature lists are reference and are scoped out (`claims/README.md`).
- **D6: the data statement** is "no accounts and no user data stored on
  Kaiord's servers; data leaves the device only to destinations the athlete
  set up". Its proof is the App's content security policy (the hosts it may
  reach), the workers' configuration tests (no storage bound) and the
  Drive and extension tests. Analytics (Umami) stays disclosed in the footer.

## Risks

- A proof that only exists is the floor: a reviewer still reads whether the
  test proves the sentence.
- Mockup labels ("9:41", weekday initials) point to the partial itself; they
  state nothing.
