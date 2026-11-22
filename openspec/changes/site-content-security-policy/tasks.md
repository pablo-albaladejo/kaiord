## 1. Policy and injection

- [x] 1.1 `scripts/lib/site-csp-policy.mjs`: landing and App source lists; `site-csp.mjs` writes the `<meta>` with the inline-script hashes (tests red first)
- [x] 1.2 `assemble-site.mjs` applies it as its last step; zod `jitless` set before the bundle on the App and the landing
- [x] 1.3 The SPA dev server serves the App policy; `e2e/fixtures/base.ts` fails a test on any violation

## 2. Guard

- [x] 2.1 `scripts/check-site-csp.mjs` (test red first), run in `e2e-prod-base` and in the deploy's artifact check

## 3. End to end

- [x] 3.1 `content-security-policy.spec.ts` (`@csp`): the built App and the real landing, no unsafe source, injected script blocked, no violation on any page

## 4. Docs

- [x] 4.1 `check-site-csp` and the assembler cover `docs/` (tests red first); docs policy with the landing's sources
- [x] 4.2 `@csp` docs specs on the real VitePress build: five pages with no violation, an injected script blocked, local search to a result, theme switch kept across a reload
- [x] 4.3 CI: the build job uploads `docs-dist`; `e2e-prod-base` downloads it and assembles with docs

## 5. Quality gates

- [x] 5.1 `pnpm test:scripts`, `pnpm lint`, `@csp` and the production-base e2e set pass
- [x] 5.2 Changeset for the App, the landing and the docs
