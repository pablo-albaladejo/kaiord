## 1. Guard

- [x] 1.1 `scripts/check-claims.test.mjs` red first: HTML text and scripts, title/metas/text alternatives with entities, `<pre>` as one unit, translation file values, dotted keys and an empty key, intro
- [x] 1.2 `scripts/lib/claims-html.mjs`, `scripts/lib/claims-json.mjs`, `intro` in `claims-units.mjs`; `claims/README.md` documents the surface kinds

## 2. Landing

- [x] 2.1 Copy rewritten from the code (EN), Spanish translations, metas, JSON-LD, llms.txt, 404, Open Graph card
- [x] 2.2 `packages/cli/src/tests/landing-code-example.test.ts` runs the code example
- [x] 2.3 Inventory freshness test in `packages/landing/src/i18n-parity.test.ts`
- [x] 2.4 `claims/landing.json` registers the four surfaces

## 3. READMEs

- [x] 3.1 Root and package READMEs and npm descriptions use Kaiord SDK / Kaiord App; withdrawn claims removed
- [x] 3.2 `claims/readme.json` registers the root intro, Features and Local-first architecture, and every published package's intro

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, landing, docs and cli tests pass; changeset for the published packages
