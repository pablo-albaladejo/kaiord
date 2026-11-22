## 1. Security contact

- [x] 1.1 Guard test `scripts/check-security-policy.test.mjs` (red), then `check-security-policy.mjs`
- [x] 1.2 `SECURITY.md` and `/.well-known/security.txt`; wire `lint:security-policy` into `pnpm lint`
- [x] 1.3 Deploy artifact check requires `.well-known/security.txt`

## 2. Internal agent notes

- [x] 2.1 Assembled-site test: no `AGENTS.md`/`CLAUDE.md`, public agent surfaces kept (red)
- [x] 2.2 `assemble-site.mjs` filters them; deploy artifact check fails on any

## 3. Provider key wording

- [x] 3.1 App Privacy section `privacy.infoLlmKeys`, English and Spanish
- [x] 3.2 Privacy policy, plus a `check-privacy-policy.mjs` rule
- [x] 3.3 BYOK guide, English and Spanish
