## 1. Guard

- [x] 1.1 `scripts/check-claims.test.mjs` red first: unregistered unit, stale entry, missing proof file, missing pinned text, skipped test, sections, missing section, wrapping and list items, locale keys, no proof and unknown field, duplicates across files, the real register, no path outside the repo
- [x] 1.2 `scripts/check-claims.mjs`, `scripts/lib/claims-units.mjs`, `scripts/lib/claims-proof.mjs`; `pnpm lint:claims` in `pnpm lint`
- [x] 1.3 `claims/README.md`: format, proofs, how to add a surface

## 2. Kaiord for Garmin

- [x] 2.1 `test/token-confinement.test.js`: tokens kept locally, never in an answer, requests to Garmin only
- [x] 2.2 Store listing, `extDescription`, permission justifications and the privacy-policy section rewritten from the code
- [x] 2.3 `claims/garmin.json` registers all four surfaces
- [x] 2.4 `check-privacy-policy` follows the renamed section; its tests pass

## 3. Glossary and decisions

- [x] 3.1 `GLOSSARY.md` and `docs/adr/0001`–`0004`

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, `@kaiord/garmin-bridge` and `@kaiord/docs` tests pass
