## 1. Proofs (seam 3, the message contract)

- [x] 1.1 `packages/tanita-bridge/test/export-confinement.test.js`: requests go only to the export as a GET; a session check downloads the whole export and answers only yes or no; the export reaches the App unchanged; the service worker stores only the theme (mutation-checked)
- [x] 1.2 `test/popup.test.js`: every open and Refresh sends a session check; the popup stores only `bridgeHealth`

## 2. Texts

- [x] 2.1 Store listing (Short and Detailed Description), `extDescription`, `privacy-justification.md` rewritten from the code
- [x] 2.2 Privacy policy section "Kaiord for Tanita Extension", the intro and the Communication Scope line
- [x] 2.3 `claims/tanita.json` registers the four surfaces

## 3. Guards (seam 1)

- [x] 3.1 `check-claims.test.mjs` red first: two registers may hold different sections of one file; a held section or a whole file is refused
- [x] 3.2 `check-claims.mjs`: ownership per file, section or key; `claims/README.md`
- [x] 3.3 `check-privacy-policy`: renamed section, two new Tanita rules, floor 13; its tests red first

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, `@kaiord/tanita-bridge` and `@kaiord/docs` tests, site guards
