## ADDED Requirements

### Requirement: Automated CWS publishing workflow

The project SHALL include a `cws-publish.yml` GitHub Actions workflow that publishes the Garmin Bridge extension to the Chrome Web Store when a new version is detected on the `main` branch.

The workflow SHALL be triggered on push to `main` when `packages/garmin-bridge/**` changes.

The workflow SHALL:

- Detect version changes by comparing `packages/garmin-bridge/package.json` version against the latest `@kaiord/garmin-bridge@*` git tag
- Run `scripts/sync-extension-version.mjs` to sync manifest versions
- Run `scripts/package-extension.sh` to produce the zip
- Upload and publish the zip to CWS via `chrome-webstore-upload-cli` using GitHub Secrets (`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_EXTENSION_ID`)
- Create a `@kaiord/garmin-bridge@{version}` git tag on success (matching the changesets `tagFormat` convention)

The workflow SHALL use a concurrency guard (`concurrency: ${{ github.workflow }}-${{ github.ref }}`) to prevent duplicate runs from racing on rapid successive merges.

The workflow SHALL run without verbose flags to minimize risk of credential fragments in logs.

Version detection SHALL use string equality comparison between the `package.json` version and the version extracted from the latest `@kaiord/garmin-bridge@*` git tag. If no tag exists or the versions differ, the workflow SHALL proceed with publishing.

#### Scenario: Extension published after version bump

- **GIVEN** changesets bumps `@kaiord/garmin-bridge` to a new version on main
- **WHEN** the `cws-publish.yml` workflow detects the version is newer than the latest git tag
- **THEN** the workflow SHALL upload and publish the new zip to the Chrome Web Store
- **AND** create a `@kaiord/garmin-bridge@{version}` git tag

#### Scenario: Extension not published when version unchanged

- **GIVEN** a push to main changes files in `packages/garmin-bridge/` but the version in `package.json` is unchanged
- **WHEN** the `cws-publish.yml` workflow runs
- **THEN** the workflow SHALL skip the upload step and exit successfully

#### Scenario: CWS upload fails

- **GIVEN** the CWS API returns an error (invalid credentials, network failure)
- **WHEN** the upload step fails
- **THEN** the workflow run SHALL show as failed (red status)
- **AND** npm publishes and GitHub releases (in separate `release.yml`) SHALL NOT be affected

#### Scenario: CWS holds update for review

- **GIVEN** the extension zip is successfully uploaded and published via API
- **WHEN** CWS holds the update for manual review
- **THEN** the workflow SHALL report success (upload completed; CWS review is asynchronous)

#### Scenario: Workflow re-run after partial failure

- **GIVEN** the workflow previously uploaded version X to CWS but failed to create the git tag
- **WHEN** the workflow is re-run
- **THEN** it SHALL re-upload version X (CWS accepts re-uploads of the same version) and create the tag

#### Scenario: First-ever run with no existing tag

- **GIVEN** no `@kaiord/garmin-bridge@*` git tag exists
- **WHEN** the `cws-publish.yml` workflow runs
- **THEN** it SHALL treat the current version as new and proceed with publishing

### Requirement: Changesets configuration for garmin-bridge

`@kaiord/garmin-bridge` SHALL be removed from the `ignore` array in `.changeset/config.json` so that changesets versions the package when changesets are consumed. Since the package is `private: true`, `changeset publish` SHALL automatically skip npm publish and SHALL NOT create git tags for it. The `cws-publish.yml` workflow is the sole creator of `@kaiord/garmin-bridge@*` tags.

#### Scenario: Garmin-bridge participates in changesets versioning

- **GIVEN** a changeset includes `@kaiord/garmin-bridge`
- **WHEN** `pnpm exec changeset version` is run
- **THEN** `packages/garmin-bridge/package.json` version SHALL be bumped

#### Scenario: Garmin-bridge is not published to npm

- **GIVEN** `@kaiord/garmin-bridge` has `private: true` in `package.json`
- **WHEN** `pnpm exec changeset publish` is run
- **THEN** the package SHALL NOT be published to npm

### Requirement: Version sync script

The project SHALL include a `scripts/sync-extension-version.mjs` script that reads the version from `packages/garmin-bridge/package.json` and writes it to the `version` field in both `packages/garmin-bridge/manifest.json` and `packages/garmin-bridge/manifest.prod.json`.

The script SHALL only modify the `version` field and leave all other manifest content unchanged. The script SHALL be idempotent — if versions already match, it SHALL exit with code 0 without modifying files.

#### Scenario: Version synced to manifests

- **GIVEN** `package.json` has version `0.2.0` and manifests have version `0.1.0`
- **WHEN** `scripts/sync-extension-version.mjs` is executed
- **THEN** both `manifest.json` and `manifest.prod.json` SHALL have version `0.2.0`
- **AND** all other fields SHALL remain unchanged

#### Scenario: Version already in sync

- **GIVEN** all three files have the same version
- **WHEN** `scripts/sync-extension-version.mjs` is executed
- **THEN** the script SHALL exit with code 0 without modifying any files

#### Scenario: Version sync fails on invalid input

- **GIVEN** `package.json` has no `version` field or a manifest file is malformed JSON
- **WHEN** `scripts/sync-extension-version.mjs` is executed
- **THEN** the script SHALL exit with a non-zero code and a descriptive error message

### Requirement: CWS credentials documentation

The project SHALL include a `docs/cws-credentials-setup.md` guide documenting the one-time setup process for CWS API credentials. The guide SHALL cover:

- Creating a Google Cloud project
- Configuring the OAuth consent screen (set to production to prevent token expiry)
- Creating OAuth2 credentials (client ID and secret)
- Generating a refresh token
- Minimum required OAuth scope (`https://www.googleapis.com/auth/chromewebstore`)
- Adding secrets to GitHub (`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_EXTENSION_ID`)
- Periodic token rotation guidance

#### Scenario: Setup guide is complete

- **WHEN** the credentials setup guide is read
- **THEN** it SHALL contain step-by-step instructions for all seven setup phases
