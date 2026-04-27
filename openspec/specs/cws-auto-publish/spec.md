> Synced: 2026-04-27 (harden-cws-publish)

# CWS Auto Publish

## Purpose

Automated Chrome Web Store publishing for every extension in the monorepo, triggered by a version bump in the extension's `package.json`.

## Requirements

### Requirement: Automated CWS publishing workflow

The project SHALL include a `cws-publish.yml` GitHub Actions workflow that publishes Chrome extensions to the Chrome Web Store when a new version is detected on the `main` branch.

The workflow SHALL be triggered on push to `main` when `packages/garmin-bridge/**` or `packages/train2go-bridge/**` changes, and on manual `workflow_dispatch`.

The workflow SHALL use a matrix strategy to publish each extension independently:

- `garmin-bridge` using secret `CWS_EXTENSION_ID`
- `train2go-bridge` using secret `CWS_TRAIN2GO_EXTENSION_ID`

Shared authentication SHALL use a **Google Cloud service-account JSON key** stored in the `CWS_SERVICE_ACCOUNT_KEY` secret (see Requirement "Service-account authentication"). The workflow SHALL NOT use OAuth user-delegated refresh tokens.

For each extension, the workflow SHALL:

- Run a pre-flight authentication check (see Requirement "Pre-flight authentication validation").
- Query the current Chrome Web Store state for the extension via the CWS API (see Requirement "Chrome Web Store API is the idempotency source of truth").
- Upload the extension zip, unless either (a) `draft.uploadState == UPLOADED` with `draft.version == package.json.version` (a prior partial publish that can be resumed) OR (b) `published.version == package.json.version` (already live, nothing to do). Both checks consult the CWS API directly. See Requirement "Upload and publish are separate, resumable steps".
- Poll for `UPLOADED` state before proceeding to publish.
- Publish the uploaded draft.
- Poll for `PUBLISHED` or `IN_REVIEW` terminal state (see Requirement "Post-publish verification").
- Create a `@kaiord/<extension>@{version}` git tag ONLY on confirmed `PUBLISHED`.

The workflow SHALL use `fail-fast: false`, `concurrency: ${{ github.workflow }}-${{ github.ref }}`, and no verbose logging flags (to minimize risk of credential fragments in logs).

The workflow SHALL expose a `force_upload: boolean (default false)` input on `workflow_dispatch` that bypasses the CWS state idempotency check for emergency re-uploads of the same version.

The workflow SHALL NOT depend on the `chrome-webstore-upload-cli` npm package — its functionality is absorbed into the in-repo helper `scripts/cws-api.mjs` to support service-account authentication.

#### Scenario: Extension published after version bump (happy path)

- **GIVEN** the service-account credentials are valid
- **AND** `packages/<ext>/package.json` has a new version `V` not present in the Chrome Web Store
- **WHEN** the workflow runs on push to `main`
- **THEN** pre-flight passes within 10 s
- **AND** the workflow uploads the CRX and polls until `draft.uploadState == UPLOADED`
- **AND** the workflow publishes and polls until `published.version == V`
- **AND** the workflow creates the git tag `@kaiord/<ext>@V`

#### Scenario: Extension not published when version unchanged

- **GIVEN** a push to main changes files in an extension package but the version in `package.json` is unchanged
- **WHEN** the `cws-publish.yml` workflow runs
- **THEN** the workflow SHALL detect that the CWS published version equals the local version
- **AND** SHALL skip the upload/publish chain and exit successfully (no-op)

#### Scenario: One extension fails without blocking the other

- **GIVEN** garmin-bridge publishes successfully but train2go-bridge fails
- **WHEN** the workflow completes
- **THEN** garmin-bridge SHALL have its tag created
- **AND** train2go-bridge SHALL show as failed independently

### Requirement: Service-account authentication

The `cws-publish.yml` workflow SHALL authenticate to the Chrome Web Store API exclusively via a Google Cloud service-account JSON key stored in the `CWS_SERVICE_ACCOUNT_KEY` GitHub Secret. Authentication SHALL use the standard Google JWT-bearer flow: the helper signs a JWT with the service-account private key, exchanges it at `https://oauth2.googleapis.com/token` for a 1-hour access token, and uses that token in `Authorization: Bearer` headers for all CWS API requests. The workflow SHALL NOT support OAuth 2.0 user-delegated refresh-token authentication.

The service account SHALL be linked to the Chrome Web Store publisher via the Chrome Web Store Developer Dashboard (Settings → Service accounts → Add account). Google permits at most one service account per publisher.

#### Scenario: Valid service-account key mints access token

- **GIVEN** `CWS_SERVICE_ACCOUNT_KEY` contains a valid service-account JSON with private key
- **AND** the service account is linked in the Chrome Web Store Developer Dashboard
- **WHEN** the helper invokes its token-mint routine
- **THEN** the routine SHALL sign an RS256 JWT with `scope: https://www.googleapis.com/auth/chromewebstore`, `aud: https://oauth2.googleapis.com/token`, `iss: <service-account-email>`, `exp: now + 3600s`, `iat: now - 60s`
- **AND** the routine SHALL exchange the JWT at Google's token endpoint and receive an access token valid for 1 hour

#### Scenario: Invalid or unlinked service account fails fast

- **GIVEN** the service-account key is malformed, revoked, or the account is not linked in the CWS Developer Dashboard
- **WHEN** the helper invokes its token-mint routine OR any CWS API call
- **THEN** the helper SHALL throw a typed `CwsAuthError` with a stable message prefix
- **AND** SHALL NOT log any portion of the private key, the access token, or the service-account email beyond what GitHub Actions already masks

### Requirement: Pre-flight authentication validation

The `cws-publish.yml` workflow SHALL include a `pre-flight` job that runs BEFORE the `publish` matrix. This job SHALL invoke `node scripts/cws-api.mjs check $CWS_EXTENSION_ID`, which SHALL (a) mint an access token using the service-account key and (b) call `GET /chromewebstore/v1.1/items/$CWS_EXTENSION_ID?projection=DRAFT` to verify the service account has read access to a known item. The `publish` matrix SHALL declare `needs: pre-flight`.

On a 4xx response consistent with authentication failure (401 Unauthorized, 403 Forbidden, invalid JWT, or revoked key), the pre-flight step SHALL fail and SHALL open (or bump) a GitHub Issue labelled `cws-auth-broken` with a link to the service-account runbook.

#### Scenario: Valid credentials pass pre-flight

- **GIVEN** `CWS_SERVICE_ACCOUNT_KEY` is valid and the service account has CWS access
- **WHEN** the pre-flight job runs
- **THEN** it SHALL exit 0 within 10 s
- **AND** the `publish` matrix SHALL proceed

#### Scenario: Invalid credentials fail pre-flight with issue

- **GIVEN** the service-account key is invalid, revoked, or the account is unlinked
- **WHEN** the pre-flight job runs
- **THEN** the job SHALL fail within 10 s
- **AND** a GitHub Issue labelled `cws-auth-broken` SHALL exist (opened fresh or bumped with a new timestamp)
- **AND** the `publish` matrix SHALL be skipped

#### Scenario: Credential revoked mid-flight (after pre-flight passes)

- **GIVEN** pre-flight passed at run start (auth was valid at T+0)
- **AND** the service-account linkage is unlinked from the Chrome Web Store Developer Dashboard during the run (e.g., manual action between T+5s and T+30s)
- **WHEN** the upload, publish, or state-query step subsequently issues an API call and receives 401 / 403
- **THEN** the helper SHALL throw a typed `CwsAuthError`
- **AND** the workflow SHALL open (or bump) an issue labelled `cws-auth-broken` — the same label and runbook link as the pre-flight path uses, so both detection modes converge on a single queue
- **AND** the matrix job for the affected extension SHALL fail

### Requirement: Upload and publish are separate, resumable steps

The workflow SHALL NOT use a single auto-publishing call (`--auto-publish` or equivalent). Upload and publish SHALL be issued as distinct helper subcommands (`upload`, `publish`), with a CWS-API-backed state check between them (`wait-uploaded`). A partial failure at publish SHALL NOT trigger a duplicate upload on the next run.

#### Scenario: Resumable after partial publish failure

- **GIVEN** a previous run completed `upload` but publish failed
- **AND** the Chrome Web Store draft has `version == package.json.version` and `uploadState == UPLOADED`
- **WHEN** the workflow re-runs
- **THEN** the "query CWS state" step SHALL observe the matching draft
- **AND** the workflow SHALL skip upload
- **AND** SHALL proceed directly to publish without a `PKG_INVALID_VERSION_NUMBER` error

#### Scenario: Fresh version triggers full upload-then-publish

- **GIVEN** Chrome Web Store has no draft matching the current `package.json.version`
- **AND** the published version is strictly older
- **WHEN** the workflow runs
- **THEN** upload runs
- **AND** `wait-uploaded` polls CWS until `draft.uploadState == UPLOADED` within 60 seconds. Rationale: CRX bundles in this repo are <2 MB; CWS typically reports `UPLOADED` within 3–10 s of a successful PUT. 60 s provides ~6× headroom.
- **AND** on `CwsTimeoutError` from `wait-uploaded`, the workflow SHALL retry `wait-uploaded` ONCE with a fresh 60 s window before failing the step. A single transient slow-poll is recoverable; two consecutive timeouts reliably indicate a CWS-side or network issue that another retry will not fix. The helper's retry count is NOT configurable from the workflow (deliberate: a workflow-side retry loop would mask this boundary).
- **AND** publish runs

### Requirement: Chrome Web Store API is the idempotency source of truth

The workflow SHALL decide whether to skip upload by consulting the CWS API's `draft.version`, `draft.uploadState`, and `published.version` — NOT by comparing local `package.json.version` against a local git tag. The git tag SHALL be a downstream record of successful publish, not an input to the next run's skip logic.

If the CWS API is unreachable (5xx, network error) during the state query, the workflow SHALL fail the step rather than fall back to the git-tag heuristic, so partial uploads are never hidden by tag state.

NOTE on CWS API quirk: the CWS API rejects `GET /items/<id>?projection=PUBLISHED` with a 400 ("Please append ?projection=DRAFT to your request"). Despite the docs implying both projections are valid, only `DRAFT` is accepted on `GET items`. The `DRAFT` response includes `crxVersion` of the currently-PUBLISHED item, so it IS the source of truth for "what version is live".

#### Scenario: Tag and CWS state disagree

- **GIVEN** no `@kaiord/<ext>@<version>` git tag exists locally
- **AND** the CWS draft has `version == <version>` with `uploadState == UPLOADED` (a prior partial publish)
- **WHEN** the workflow runs
- **THEN** the workflow SHALL trust the CWS API state, skip upload, and proceed to publish

### Requirement: Post-publish verification

After `publish`, the workflow SHALL poll the CWS API for up to 2 minutes. Rationale: this timeout confirms publish **dispatch** reached a terminal state, NOT end-user-review completion (which can take hours-to-days). 120 s is chosen as 2× the observed p95 publish-dispatch latency. The poll SHALL terminate on any of four terminal states: `PUBLISHED`, `IN_REVIEW`, `REJECTED`, or `TIMEOUT` (no terminal state reached within the window).

The `wait-published` subcommand SHALL print a structured JSON contract to stdout on exit:

```json
{
  "status": "PUBLISHED" | "IN_REVIEW" | "REJECTED" | "TIMEOUT",
  "version": "<the semver polled>",
  "raw": <last CWS response body as object>
}
```

The workflow SHALL branch on `status`:

- `PUBLISHED` → create the `@kaiord/<ext>@<version>` git tag; matrix job exits 0.
- `IN_REVIEW` → open `cws-publish-verification-timeout` issue (scoped per-extension per-version); NO git tag; matrix job exits 0 (non-blocking; manual review is a legitimate queue state).
- `REJECTED` → open `cws-publish-rejected` issue (distinct label, scoped per-extension per-version) with the `itemError` payload; NO git tag; matrix job **FAILS** (a rejected CRX is a human-actionable policy/validation error; leaving subsequent releases to ship over an unresolved rejection would silently compound the problem).
- `TIMEOUT` → same behavior as `IN_REVIEW` (CWS may simply be slow; issue opens for visibility; exit 0).

#### Scenario: Publish reaches live

- **GIVEN** publish succeeds
- **AND** within 2 minutes the CWS response shows `published.version == package.json.version`
- **WHEN** `wait-published` terminates
- **THEN** stdout SHALL contain `{"status":"PUBLISHED",...}`
- **AND** the workflow SHALL create the git tag
- **AND** the matrix job SHALL exit 0

#### Scenario: Publish enters manual review

- **GIVEN** publish succeeds
- **AND** within 2 minutes CWS reports `reviewState: IN_REVIEW` with no live version
- **WHEN** `wait-published` terminates
- **THEN** stdout SHALL contain `{"status":"IN_REVIEW",...}`
- **AND** the workflow SHALL open a `cws-publish-verification-timeout` issue scoped to this extension + version
- **AND** the matrix job SHALL exit 0
- **AND** no git tag SHALL be created

#### Scenario: Publish is rejected

- **GIVEN** publish dispatched
- **AND** at the next poll cycle (≤2s after dispatch) CWS returns a rejection marker (`itemError` containing REJECTED state or equivalent)
- **WHEN** `wait-published` terminates
- **THEN** stdout SHALL contain `{"status":"REJECTED",...}`
- **AND** `wait-published` SHALL fail-fast: the elapsed wall-clock time from invocation to exit SHALL be `< 5 seconds`
- **AND** the workflow SHALL open a `cws-publish-rejected` issue scoped to this extension + version with the full `itemError` payload
- **AND** the matrix job SHALL FAIL (non-zero exit)
- **AND** no git tag SHALL be created

#### Scenario: Publish silently stalls

- **GIVEN** publish succeeds
- **AND** after 2 minutes CWS reports neither `PUBLISHED` nor `IN_REVIEW` nor `REJECTED`
- **WHEN** `wait-published` terminates
- **THEN** stdout SHALL contain `{"status":"TIMEOUT",...}`
- **AND** the workflow SHALL open a `cws-publish-verification-timeout` issue with the last CWS payload
- **AND** the matrix job SHALL exit 0 (non-blocking; a stall is recoverable, unlike a rejection)

### Requirement: Emergency force-republish override

The workflow SHALL accept a `force_upload: boolean (default false)` input on `workflow_dispatch`. When `true`, the "query CWS state" step SHALL be skipped and the upload step SHALL run unconditionally — allowing emergency re-uploads of the same version (known-bad CRX, credential leak in a shipped bundle, post-publish malware-scan rejection). When `false` (the default), the normal idempotency guard applies.

This override SHALL be documented in the service-account runbook.

#### Scenario: Emergency re-upload of same version

- **GIVEN** a shipped CRX at `version V` is known-bad
- **AND** CWS has `published.version == V`
- **WHEN** a maintainer triggers `workflow_dispatch` with `force_upload: true`
- **THEN** the workflow SHALL skip the CWS state check
- **AND** SHALL upload the current `package.json.version == V` CRX
- **AND** SHALL proceed through publish and verification

### Requirement: Service-account setup and rotation runbook

The repository SHALL contain `docs/runbooks/cws-service-account.md` documenting:

- **One-time setup**: Google Cloud project, service-account creation, JSON key generation, CWS Developer Dashboard linkage (Settings → Service accounts), `CWS_SERVICE_ACCOUNT_KEY` GitHub Secret upload.
- **Key rotation**: service-account JSON keys do not expire automatically; rotation is a maintainer-initiated security action. Procedure: generate a new key in Google Cloud Console, update `CWS_SERVICE_ACCOUNT_KEY`, revoke the old key.
- **Emergency re-publish**: how to use `workflow_dispatch` with `force_upload: true`.
- **Compromised-key response**: immediate rotation + audit of recent CWS activity via the Developer Dashboard.

The `cws-auth-broken` and `cws-publish-verification-timeout` issue bodies SHALL link to this runbook.

#### Scenario: Maintainer follows the runbook after a pre-flight failure

- **GIVEN** a `cws-auth-broken` issue is open
- **WHEN** the maintainer opens the issue
- **THEN** the body SHALL link to `docs/runbooks/cws-service-account.md`
- **AND** following the runbook's "Key rotation" section SHALL produce a new `CWS_SERVICE_ACCOUNT_KEY` value that passes pre-flight on the next `workflow_dispatch`

### Requirement: Changesets configuration for extensions

`@kaiord/garmin-bridge` and `@kaiord/train2go-bridge` SHALL participate in changesets versioning. Since both packages are `private: true`, `changeset publish` SHALL automatically skip npm publish. The `cws-publish.yml` workflow is the sole creator of extension git tags.

NOTE: changesets excludes private packages from linked-group bumps by default. To bump extension versions, a maintainer SHALL either (a) author a changeset that explicitly includes the extension package, or (b) edit `packages/<ext>/package.json` + `manifest.json` + `manifest.prod.json` directly. Public-package linked-group bumps DO NOT propagate to the private extensions.

#### Scenario: Extension participates in changesets versioning

- **GIVEN** a changeset includes an extension package
- **WHEN** `pnpm exec changeset version` is run
- **THEN** the extension's `package.json` version SHALL be bumped

#### Scenario: Extension is not published to npm

- **GIVEN** an extension has `private: true` in `package.json`
- **WHEN** `pnpm exec changeset publish` is run
- **THEN** the package SHALL NOT be published to npm

### Requirement: Version sync script

The project SHALL include a `scripts/sync-extension-version.mjs` script that accepts an optional extension name argument. When called with an argument (e.g., `train2go-bridge`), it SHALL sync only that extension. When called without arguments, it SHALL sync all extensions (`garmin-bridge`, `train2go-bridge`).

For each extension, the script SHALL read the version from `packages/<extension>/package.json` and write it to the `version` field in `packages/<extension>/manifest.json`, `packages/<extension>/manifest.prod.json`, AND the `BRIDGE_MANIFEST.version` literal inside `packages/<extension>/background.js`. The latter is the value the extension reports to the SPA via the `ping` action — keeping it in lockstep with the published manifest version is required for the SPA's "Update your extension" detection to work correctly.

The script SHALL only modify the `version` fields and leave all other content unchanged. The script SHALL be idempotent — if all three files already match, it SHALL exit with code 0 without modifying files.

The script SHALL fail loudly (exit code 1) if `background.js` exists for an extension but no `BRIDGE_MANIFEST … version: "…"` literal can be located, since that means a refactor moved or renamed the constant and the sync is silently broken.

#### Scenario: Version synced to manifests and background.js

- **GIVEN** `package.json` has version `0.2.0`, the manifests have version `0.1.0`, and `background.js` declares `BRIDGE_MANIFEST = { …, version: "0.1.0", … }`
- **WHEN** `scripts/sync-extension-version.mjs <extension>` is executed
- **THEN** `manifest.json`, `manifest.prod.json`, AND the `BRIDGE_MANIFEST.version` literal in `background.js` SHALL all be updated to `0.2.0`
- **AND** all other fields SHALL remain unchanged

#### Scenario: Missing BRIDGE_MANIFEST literal fails loudly

- **GIVEN** `background.js` exists for an extension but does not contain a `BRIDGE_MANIFEST … version: "…"` literal
- **WHEN** `scripts/sync-extension-version.mjs <extension>` is executed
- **THEN** the script SHALL exit with a non-zero code and an error pointing at `background.js`

#### Scenario: Version already in sync

- **GIVEN** all three files have the same version
- **WHEN** `scripts/sync-extension-version.mjs` is executed
- **THEN** the script SHALL exit with code 0 without modifying any files

#### Scenario: Version sync fails on invalid input

- **GIVEN** `package.json` has no `version` field or a manifest file is malformed JSON
- **WHEN** `scripts/sync-extension-version.mjs` is executed
- **THEN** the script SHALL exit with a non-zero code and a descriptive error message
