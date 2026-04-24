## ADDED Requirements

### Requirement: Pre-flight CWS token validation

The `cws-publish.yml` workflow SHALL validate the Chrome Web Store OAuth refresh token before any upload attempt. The pre-flight step SHALL call the CWS API to fetch a known extension's metadata (e.g., `GET /items/<id>?projection=DRAFT`) using the shared credentials. If the API returns a 4xx response consistent with token expiry (`401 invalid_grant`, `403 Forbidden`), the workflow SHALL fail fast (before running `pnpm install` or building the zip) and SHALL open or bump a GitHub issue labelled `cws-token-refresh-needed`. On a successful pre-flight, the workflow SHALL proceed to upload.

#### Scenario: Expired token detected before upload

- **GIVEN** the `CWS_REFRESH_TOKEN` secret has been revoked by Google
- **WHEN** the pre-flight step calls the CWS API
- **THEN** the step SHALL fail within 10 s of invocation
- **AND** a GitHub issue labelled `cws-token-refresh-needed` SHALL exist (newly opened if none exists, updated with a fresh timestamp if one already does)
- **AND** no upload, no package install, and no zip build SHALL have run

#### Scenario: Valid token passes pre-flight

- **GIVEN** the `CWS_REFRESH_TOKEN` is valid
- **WHEN** the pre-flight step calls the CWS API
- **THEN** the step SHALL exit 0
- **AND** the workflow SHALL proceed to the version-change detection step

### Requirement: Upload and publish are separate, resumable steps

The workflow SHALL NOT use `chrome-webstore-upload-cli upload --auto-publish`. Upload and publish SHALL be issued as distinct steps, with a CWS-API-backed state check between them that verifies the uploaded CRX reached `UPLOADED` state. A failed publish SHALL NOT leave the next run in a state where it attempts to re-upload the same version; the next run's pre-upload idempotency check SHALL observe the existing upload and proceed to publish only.

#### Scenario: Partial publish failure is resumable

- **GIVEN** a previous workflow run completed `upload` successfully but `publish` failed (e.g., transient CWS 5xx)
- **AND** Chrome Web Store's `draft.version` for the extension equals the current `packages/<ext>/package.json` version
- **AND** `draft.uploadState` is `UPLOADED`
- **WHEN** the workflow re-runs on the same commit (or a new commit that did not re-bump the version)
- **THEN** the workflow SHALL skip the upload step (no `PKG_INVALID_VERSION_NUMBER` error)
- **AND** the workflow SHALL proceed directly to `publish`

#### Scenario: Fresh version triggers upload + publish

- **GIVEN** Chrome Web Store has no draft for the current `packages/<ext>/package.json` version
- **AND** the published version in CWS is strictly older than the current `package.json` version
- **WHEN** the workflow runs
- **THEN** the upload step SHALL execute
- **AND** the workflow SHALL poll CWS until `draft.uploadState` is `UPLOADED` (timeout 60 s)
- **AND** the publish step SHALL then execute

### Requirement: Chrome Web Store API is the idempotency source of truth

The workflow SHALL determine whether to skip upload by querying the CWS API's `draft.version` and `published.version`, NOT by comparing the local `package.json` version against the local git tag. If the CWS API is unreachable (5xx, network error), the workflow SHALL fail the pre-flight step rather than fall back to the git-tag heuristic, so partial uploads are never hidden by tag state.

#### Scenario: Tag and CWS state disagree

- **GIVEN** the `@kaiord/<ext>@<version>` git tag does NOT exist (no successful publish recorded locally)
- **AND** Chrome Web Store's `draft.version` equals `<version>` with `uploadState: UPLOADED`
- **WHEN** the workflow runs
- **THEN** the workflow SHALL trust the CWS API state
- **AND** SHALL skip upload
- **AND** SHALL proceed to publish

### Requirement: Post-publish verification

After the `publish` step completes, the workflow SHALL poll the CWS API (via `GET /items/<id>?projection=PUBLISHED`) for up to 2 minutes or until the published version equals `packages/<ext>/package.json` version OR the CWS response indicates the extension is in a review queue (`reviewState: IN_REVIEW`). If neither condition is met within the timeout, the workflow SHALL open a GitHub issue labelled `cws-publish-verification-timeout` with the last observed CWS response payload, but SHALL NOT fail the workflow (manual review is a legitimate state that should not block future releases).

#### Scenario: Publish reaches live within timeout

- **GIVEN** the publish step succeeds
- **AND** within 2 minutes the CWS published state equals the local `package.json` version
- **WHEN** the verification step runs
- **THEN** the workflow SHALL report success
- **AND** SHALL write the `@kaiord/<ext>@<version>` git tag

#### Scenario: Publish enters manual review queue

- **GIVEN** the publish step succeeds
- **AND** within 2 minutes CWS reports `reviewState: IN_REVIEW` but not `PUBLISHED`
- **WHEN** the verification step runs
- **THEN** the workflow SHALL report success
- **AND** SHALL open a GitHub issue labelled `cws-publish-verification-timeout` recording the in-review state for maintainer awareness

#### Scenario: Publish is silently stuck

- **GIVEN** the publish step succeeds
- **AND** after 2 minutes CWS reports neither `PUBLISHED` nor `IN_REVIEW`
- **WHEN** the verification step runs
- **THEN** the workflow SHALL report success (non-blocking) but SHALL open a GitHub issue labelled `cws-publish-verification-timeout` with the last CWS response payload

### Requirement: Weekly CWS token health check

The project SHALL include a `cws-token-health.yml` GitHub Actions workflow that runs on cron schedule `0 9 * * 1` (Monday 09:00 UTC) and SHALL execute a dry CWS API call (`GET /items/<id>`) using the shared credentials. On a non-2xx response consistent with token expiry, the workflow SHALL open or bump a GitHub issue labelled `cws-token-refresh-needed` (the same label used by the reactive pre-flight check) so both detection paths converge on a single queue. On success, the workflow SHALL exit without leaving artefacts. The workflow SHALL also expose `workflow_dispatch` so the check can be re-run manually after a token rotation.

#### Scenario: Healthy token during weekly check

- **GIVEN** the `CWS_REFRESH_TOKEN` is valid
- **WHEN** the weekly `cws-token-health` workflow runs on its scheduled trigger
- **THEN** the workflow SHALL exit 0
- **AND** SHALL NOT create any issue, comment, or artefact

#### Scenario: Expired token surfaced proactively

- **GIVEN** the `CWS_REFRESH_TOKEN` has been revoked
- **WHEN** the weekly `cws-token-health` workflow runs on its scheduled trigger
- **THEN** the workflow SHALL fail the step and SHALL open (or update) an issue labelled `cws-token-refresh-needed` with a link to `docs/runbooks/cws-token-rotation.md`

### Requirement: Documented token-rotation runbook

The repository SHALL contain a `docs/runbooks/cws-token-rotation.md` that provides a step-by-step procedure for rotating the Chrome Web Store OAuth refresh token. The runbook SHALL cover: (a) which Google Cloud project and OAuth client the token is minted against; (b) the exact command (`chrome-webstore-upload-cli init`) to run locally and the consent-screen flow it triggers; (c) where to paste the resulting `refresh_token` (repo Settings → Secrets → Actions → `CWS_REFRESH_TOKEN`); (d) how to verify the new token (trigger `cws-token-health` via `workflow_dispatch`). The `cws-token-refresh-needed` issue template SHALL link to this runbook.

#### Scenario: Maintainer follows the runbook

- **GIVEN** a `cws-token-refresh-needed` issue is open
- **WHEN** the maintainer opens the issue
- **THEN** the issue body SHALL contain a link to `docs/runbooks/cws-token-rotation.md`
- **AND** following the runbook's steps SHALL produce a new `CWS_REFRESH_TOKEN` value that passes `cws-token-health` on the next dispatch
