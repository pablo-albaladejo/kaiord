## 1. Claims register

- [x] 1.1 Tests red first: an author statement holds; one by a name, with an email, with no date or empty is refused; a claim citing one counts as declared, even beside a test
- [x] 1.2 `scripts/lib/claims-statement.mjs`, the proof kind in `claims-proof.mjs`, strength `statement`, the summary line
- [x] 1.3 `claims/README.md`, `AGENTS.md`, `scripts/README.md`

## 2. Method note

- [x] 2.1 "The owner's statement" section, labelled as the owner's declaration, with the `.kiro/` and bot figures beside it
- [x] 2.2 Dependabot, release bot and GitHub Actions figures at the pinned commit
- [x] 2.3 `method.headline`, `landing.en.ai.headline`, `landing.es.ai.headline` cite the statement and the section

## 3. Legal hygiene

- [x] 3.1 DCO in `CONTRIBUTING.md`; `scripts/check-dco.mjs` test-first; `.github/workflows/dco.yml`
- [x] 3.2 `pnpm run licenses:text` (`scripts/generate-third-party-licenses.mjs`, test-first) and the regenerated `THIRD-PARTY-LICENSES.md`
- [x] 3.3 `@kaiord/fit` README License section and description, a test reading both manifests and Garmin's agreement, registered claims (`claims/packages.json`)
- [x] 3.4 Root README "personal project" sentence, with the owner's author statement

## 4. Not evaluated

- [x] 4.1 `EVALUATED_MODELS` / `isEvaluatedModel` in `@kaiord/ai/providers`, tied by a test to the committed eval results
- [x] 4.2 App tests red first (English and Spanish); `useModelName` at every place a model is offered or shown
- [x] 4.3 The cost-per-model design records Google's reroute of `gemini-2.5-flash` on 2026-12-01

## 5. Quality gates

- [x] 5.1 `pnpm lint`, `pnpm test:scripts`, the fit, ai, docs and landing tests, the App unit suite, the docs build and `check-site-links`, `openspec validate --strict` on every open change
