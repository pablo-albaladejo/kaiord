## Why

Review of 2026-11-22, issue #1632 (parent #1670, story 65; decisions "Claims
register" and "Agents merge on their own"). The landing says "Every line —
domain, adapters, editor, this page — written by AI agents." and links only to
the commit list. Nothing tells a reader how the project is built, what a person
does, or how to check the sentence, and the history cannot prove "every line":
it records commits and their trailers, not who typed each line.

## What Changes

- **Method note.** `packages/docs/project/how-kaiord-is-built.md`
  (`/docs/project/how-kaiord-is-built`, in the docs sidebar under Guides)
  explains how agents build Kaiord (OpenSpec changes, guards, changesets,
  reviews, agents merging), what a person does (decisions, the denied actions,
  secrets, real-account tests, store dashboards), and how to check it. It says
  precisely what the history supports and what it does not.
- **Figures pinned to a commit.** Each figure is a table row with its value and
  the command that reproduces it. Every command names commit `b9b38f824` (the
  tip of `main` on 2026-11-22), so its answer never moves.
  `scripts/check-method-figures.mjs` (`pnpm lint:method-figures`, in
  `pnpm lint`) reruns every command and fails when the note's number differs
  (tolerance 0), when a command does not name the pinned commit, or when it is
  not a pipeline of `git`, `grep` and `wc`. It needs the pinned commit in the
  clone: the CI lint job checks out with full history; a shallow clone fails
  with a fetch hint. Its tests build their own git repository, so
  `pnpm test:scripts` passes on a shallow clone.
- **Register.** `claims/method.json` registers the whole note, including the
  headline it quotes (`method.headline`), each with its proof.
- **Landing.** One link, "How it is built →" ("Cómo se construye (en inglés) →"
  on the Spanish page), next to the headline. The headline is unchanged.

## Capabilities

### New Capabilities

- `method-note`: the note, its pinned figures and their guard.

### Modified Capabilities

- `landing-page`: the AI-coded line links to the method note.

## Impact

- `packages/docs` (new page, sidebar), `packages/landing` (one link and its two
  strings), `scripts/` (guard and test), `claims/`, root `package.json`.
- Nothing published: docs and landing are private packages, so no changeset.
- Out of scope: rewording the headline (the owner's call; the note says what
  the history supports), the landing as a claims surface (#1630), a Spanish
  version of the note.
