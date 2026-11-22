## Why

Code review of the truth block (#1670; tickets #1625–#1628, #1630–#1632). The
guards that hold the public texts to the code could be fooled, and some
public texts still said withdrawn or false things:

- `check-method-figures` ran commands from a Markdown file through a shell and
  checked only that each pipeline segment started with git, grep or wc, so
  `git -c alias.x='!…'` or `git log --output=…` ran.
- A test proof passed when the title sat in a comment, a string or a skipped
  `describe`.
- A short unit ("5", "Accounts") could be added a second time anywhere on its
  surface and pass with the first one's proof.
- The HTML reader skipped placeholders, `aria-description`, the keywords meta
  and JSON-LD.
- 163 of 678 claims had no real proof: their own surface, a file existing, an
  endpoint never fetched, or a pin too short to mean anything.
- The landing's data statement left out intervals.icu and Umami; the docs
  home, the MCP instructions and the App's page still said "framework",
  "lossless", "data never leaves the browser" and "Garmin & WHOOP sync".

## What Changes

- **Method figures without a shell.** Each command is split into argv and
  checked against an allowlist of git subcommands and options, grep and wc;
  each stage is spawned directly and piped in-process, git with no user or
  system config.
- **Test proofs that run.** Comments, strings and regex bodies are blanked
  before the call is found; a skipped, todo, conditional or `.only`-excluded
  test or describe proves nothing.
- **Multiplicity.** A text must appear on its register's surfaces as many
  times as the register has entries for it, or as its `count` says.
- **More of the page read.** `placeholder`, `aria-description`, the keywords
  meta, the JSON-LD a search engine shows, HTML inside Markdown, without
  `<script>`/`<style>` blocks or quote markers.
- **Claim kinds and proof strength.** `kind: "label"` for text that states
  nothing (no proof); `kind: "external"` for a quote of a third party (url and
  `read_on`, stale after 180 days); any other claim needs a running test or a
  pin of 16+ characters outside its own surfaces. `pnpm lint:claims` prints a
  one-line summary.
- **Retired terms guard.** `scripts/check-retired-terms.mjs`
  (`pnpm lint:retired-terms`, in `pnpm lint`) fails on framework, cockpit,
  lossless, zero data loss, round-trip safe, open standard, interchange format
  and platform for Kaiord itself, on every registered surface and a list of
  non-prose files.
- **Texts from the code.** The data statement names every destination and
  Umami; the docs home, getting started, converters and KRD pages, the MCP
  instructions, the App's page, garmin-connect's description and the
  extension, App and landing READMEs are rewritten and registered.

## Capabilities

### Modified Capabilities

- `public-claims`: proofs that run, multiplicity, kinds, proof strength,
  JSON-LD, retired terms.
- `method-note`: the figures guard runs no shell.

## Impact

- `scripts/`: the claims and method-figures guards, new helpers in
  `scripts/lib/` with sibling tests, the new retired-terms guard.
- `claims/`: every register reclassified; new `app.json` and `docs.json`.
- `@kaiord/mcp` and `@kaiord/garmin-connect`: text only, a changeset.
- `@kaiord/landing`, `@kaiord/docs`, `@kaiord/workout-spa-editor`: texts and
  tests.
- Out of scope: splitting `check-privacy-policy.mjs`, the rest of the
  glossary's _Avoid_ lists (#1646, #1661), round-trip coverage (#1654).
