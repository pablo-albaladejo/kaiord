## 1. Guard

- [x] 1.1 `scripts/check-method-figures.test.mjs` red first, on a git repository it builds: figures match, a drifted figure is named, a zero count holds, a missing pinned commit gives a fetch hint, an unpinned command and a non-pipeline command are refused, no pin and no figure fail, and the published note's commands are all pinned pipelines (without its history)
- [x] 1.2 `scripts/check-method-figures.mjs`; `pnpm lint:method-figures` in `pnpm lint`

## 2. Note

- [x] 2.1 Figures computed from `git log` at `b9b38f824`, each with its command
- [x] 2.2 `packages/docs/project/how-kaiord-is-built.md`: process, what a person does, how to check, what the figures do not show; in the docs sidebar
- [x] 2.3 `claims/method.json` registers the note and the headline it quotes; `claims/README.md` lists it

## 3. Landing

- [x] 3.1 "How it is built →" link next to the headline, English and Spanish strings

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, `@kaiord/landing` and `@kaiord/docs` tests, docs and landing build, `check-site-links` and `check-site-csp` on the built site
