# Tasks

## 1. Remove the profile trim

- [x] 1.1 Drop the `kaiord-fitsdk-profile-trim` plugin from `vite.config.ts`.
- [x] 1.2 Delete `src/lib/fitsdk-minimal/`, the generator and its script;
      update the AGENTS.md files, `.prettierignore` and `.jscpd.json`.
- [x] 1.3 Measure the `kaiord-fit` chunk (gzip) before and after, and run
      `pnpm size:spa`.

## 2. Gate it

- [x] 2.1 `e2e/fit-import-prod-bundle.spec.ts` (`@prod-bundle`).
- [x] 2.2 `e2e-prod-base` greps `@spa-route-refresh|@prod-bundle`.
- [x] 2.3 Prove the spec fails on the trimmed build (local run, and a canary
      PR that restores only the plugin and the generated profile).

## 3. Deploy

- [x] 3.1 `deploy-site.yml` writes `merged-dist/app/version.json` and the
      merged-artifact check requires it.
