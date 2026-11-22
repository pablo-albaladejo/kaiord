## 1. The register

- [x] 1.1 `packages/docs/scripts/platform-access.test.mjs` red first: five entries, three parts each, listed in the sidebar
- [x] 1.2 `packages/docs/legal/platform-access.md` written from the code and from each Platform's terms, read on 2026-11-22
- [x] 1.3 `claims/platform-access.json` registers every unit of the page

## 2. Links

- [x] 2.1 Landing footer link, test first (`src/platform-access-link.test.ts`), English and Spanish
- [x] 2.2 Connections page link, test first (`ConnectionsTab.platform-access.test.tsx`), English and Spanish

## 3. Quality gates

- [x] 3.1 `pnpm lint`, `pnpm test:scripts`, tests of `@kaiord/docs`, `@kaiord/landing`, `@kaiord/workout-spa-editor`, the site link and content-security-policy guards
