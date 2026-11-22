## 1. Proofs

- [x] 1.1 `packages/trainingpeaks-bridge/test/token-confinement.test.js`: token minted and kept locally on a session check, in no answer to any external action, requests to `tpapi.trainingpeaks.com` only, no DELETE/PUT/PATCH in the allowlist (mutation-checked red)
- [x] 1.2 `use-trainingpeaks-push.test.tsx`: the Workout is placed on the day it has in Kaiord (red against a hard-coded date)

## 2. Guard

- [x] 2.1 `scripts/check-claims.test.mjs` red first: two register files with different sections of one file pass; the same section in two fails; a whole file against a section fails
- [x] 2.2 `scripts/check-claims.mjs` splits ownership of a file by section or key; `claims/README.md` says so

## 3. Kaiord for TrainingPeaks

- [x] 3.1 Store listing, `extDescription`, permission justifications and the privacy-policy section rewritten from the code
- [x] 3.2 `claims/trainingpeaks.json` registers all four surfaces
- [x] 3.3 `check-privacy-policy` follows the renamed section; Workout-write rules replace the weight write-back rule; floor 16

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, `@kaiord/trainingpeaks-bridge`, `@kaiord/workout-spa-editor` and `@kaiord/docs` tests, site guards
