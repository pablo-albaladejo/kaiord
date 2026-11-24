## Why

Owner decisions of 2026-11-23 on Kaiord's public claims and legal hygiene
(issues #1632, #937, #1650):

- The landing headline "Every line — … written by AI agents." stays. The
  history cannot prove it (git records commits, not who typed each line), so
  it rests on the owner's own statement: every commit not made by a bot was
  written by an AI agent, and before February 2026 the agent was Kiro, which
  left no co-author trailer. The claims register had no way to record a
  declaration as such, so it was counted as proven by test.
- Outside contributions arrive with no DCO; `THIRD-PARTY-LICENSES.md` pointed
  at a `licenses:text` script that did not exist; `@kaiord/fit` is published
  as MIT while it depends on Garmin's FIT SDK, which is not MIT.
- The README did not say Kaiord is a personal project.
- No Google or OpenAI model has passed the evals, yet the App offered every
  Provider's default with nothing to tell it apart from an evaluated one.
  Google moves `gemini-2.5-flash` calls to Gemini 3.5 Flash-Lite on
  2026-12-01.

## What Changes

- **Author statements.** A new proof kind in `claims/*.json`,
  `{ "author-statement", "by", "on" }`: the owner's exact words, by role
  (never a name or an email), on a date. A claim citing one counts as
  "declared by author statement" in the `pnpm lint:claims` summary, never as
  proven by test or code.
- **The headline's proof.** The method note gets "The owner's statement",
  labelled as the owner's declaration, with the history beside it: the 197
  commits before 2026-02-01 that touch `.kiro/`, and the 201 bot commits
  split into Dependabot, the release bot and GitHub Actions, each a figure
  the figures guard reruns at the pinned commit. `method.headline`,
  `landing.en.ai.headline` and `landing.es.ai.headline` cite the statement
  and the section. The headline's wording is unchanged.
- **DCO.** `CONTRIBUTING.md` adopts the DCO 1.1 sign-off; the "DCO sign-off"
  job (`.github/workflows/dco.yml`, `scripts/check-dco.mjs`) fails a pull
  request from an outside contributor with an unsigned non-merge commit.
- **Licenses.** `pnpm run licenses:text` regenerates
  `THIRD-PARTY-LICENSES.md`; `@kaiord/fit`'s README and description say its
  own code is MIT and it depends on `@garmin/fitsdk` under Garmin's FIT
  Protocol License Agreement, registered as claims.
- **Personal project.** The root README says Kaiord is a personal project,
  not affiliated with any employer, declared by the owner.
- **"Not evaluated".** `@kaiord/ai/providers` exports `EVALUATED_MODELS` and
  `isEvaluatedModel`, tied by a test to the committed eval results. The App
  marks every other model "(not evaluated)" ("(no evaluado)") wherever a
  model is offered or shown. The cost-per-model design records Google's
  reroute of `gemini-2.5-flash`.

## Capabilities

### New Capabilities

- `contributor-dco`: sign-off required of outside contributors.

### Modified Capabilities

- `public-claims`: author statements as a declared proof kind.
- `method-note`: the owner's statement and the figures beside it.
- `spa-ai-model-selection`: a model with no passing eval result is labelled
  not evaluated.

## Impact

- `scripts/` (claims guard, DCO check, licenses generator, with tests),
  `claims/` (method, landing, readme, new `packages.json`),
  `packages/docs` (method note), `packages/fit` (README, description, a
  test), `packages/ai/providers` (`eval-status.ts`, a test),
  `packages/workout-spa-editor` (a namer hook and its call sites, en/es),
  `.github/workflows/dco.yml`, `CONTRIBUTING.md`, `README.md`,
  `THIRD-PARTY-LICENSES.md`.
- `@kaiord/fit` and `@kaiord/ai` changesets (patch).
- Out of scope: the weekly evals of OpenAI and Google and choosing an
  evaluated default per Provider (#1650's other criteria); a CLA.
