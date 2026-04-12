## 1. Changesets Configuration

- [x] 1.1 Remove `@kaiord/garmin-bridge` from the `ignore` array in `.changeset/config.json` (do NOT add it to the `linked` array — its versions are independent of public packages)
- [x] 1.2 Verify: create a test changeset for garmin-bridge, run `pnpm exec changeset version`, confirm package.json version is bumped

## 2. Version Sync Script

- [x] 2.1 Create `scripts/sync-extension-version.mjs` that reads version from `packages/garmin-bridge/package.json` and updates `version` field in both `manifest.json` and `manifest.prod.json` (idempotent — no-op if already in sync, exits non-zero with error on invalid input)
- [x] 2.2 Integrate sync into `scripts/changeset-version.sh` so manifest bumps are committed alongside package.json bumps in the Version Packages PR
- [x] 2.3 Test the script: change `package.json` version, run sync, verify both manifests are updated and other fields are unchanged

## 3. CWS CLI Setup

- [x] 3.1 Add `chrome-webstore-upload-cli` as root devDependency

## 4. CWS Publish Workflow

- [x] 4.1 Create `.github/workflows/cws-publish.yml`: triggered on push to main when `packages/garmin-bridge/**` changes. Uses `fetch-depth: 0` for tag access. Declares minimal permissions (`contents: write`). Uses concurrency guard (`github.workflow-github.ref`). Detects version change by string equality of package.json version vs latest `@kaiord/garmin-bridge@*` git tag (use `git tag -l '@kaiord/garmin-bridge@*'` with shell quoting) (first run with no tag treats current version as new). If newer: runs version sync, runs packaging script, uploads and publishes via `chrome-webstore-upload-cli` (using `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_EXTENSION_ID`), creates `@kaiord/garmin-bridge@{version}` git tag. Runs without verbose flags. Re-runs are safe (CWS accepts same-version re-uploads).
- [x] 4.2 Add `packages/garmin-bridge/**` to `.github/workflows/release.yml` `paths` trigger (ensures the changeset version step runs when garmin-bridge changesets are consumed alongside other package changes)

## 5. Credentials Documentation

- [x] 5.1 Create `docs/cws-credentials-setup.md` with step-by-step guide: Google Cloud project, OAuth consent screen (set to production), OAuth2 credentials, minimum scope (`chromewebstore`), refresh token generation, GitHub Secrets setup (including `CWS_EXTENSION_ID`), periodic token rotation
- [x] 5.2 Update `packages/garmin-bridge/store-listing.md` submission checklist to reflect the automated flow

## 6. Quality & Documentation

- [x] 6.1 Run `pnpm -r test && pnpm -r build && pnpm lint:fix` — ensure zero errors/warnings
- [x] 6.2 Add changeset via `pnpm exec changeset`
- [ ] 6.3 Commit with conventional commit: `feat(garmin-bridge): automate Chrome Web Store publishing`
