## 1. Proofs

- [x] 1.1 `test/request-confinement.test.js` red against a mutated bridge, green on the real one

## 2. Texts

- [x] 2.1 Store listing, `extDescription`, permission justifications and the privacy-policy section rewritten from the code
- [x] 2.2 `cws-privacy-practices.txt` folded into `privacy-justification.md`
- [x] 2.3 `claims/train2go.json` registers all four surfaces

## 3. Guards

- [x] 3.1 `check-claims`: two register files may own different sections of one file (tests red first)
- [x] 3.2 `check-privacy-policy`: Train2Go heading, rules pinned to true sentences, floor 11; every rule fails alone

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, `@kaiord/train2go-bridge` and `@kaiord/docs` tests, site link guard
