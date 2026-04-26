## MODIFIED Requirements

### Requirement: Automated CWS publishing workflow

The project SHALL include a `cws-publish.yml` GitHub Actions workflow that publishes Chrome extensions to the Chrome Web Store when a new version is detected on the `main` branch.

The workflow SHALL be triggered on push to `main` when `packages/garmin-bridge/**` or `packages/train2go-bridge/**` changes, and on manual `workflow_dispatch`.

The workflow SHALL use a matrix strategy to publish each extension independently:

- `garmin-bridge` using secret `CWS_EXTENSION_ID`
- `train2go-bridge` using secret `CWS_TRAIN2GO_EXTENSION_ID`

Shared authentication SHALL use a **Google Cloud service-account JSON key** stored in the `CWS_SERVICE_ACCOUNT_KEY` secret (see ADDED Requirement "Service-account authentication"). The workflow SHALL NOT use OAuth user-delegated refresh tokens; the prior secrets `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` SHALL be removed from the repository once this change is applied end-to-end.

For each extension, the workflow SHALL:

- Run a pre-flight authentication check (see ADDED Requirement "Pre-flight authentication validation").
- Query the current Chrome Web Store state for the extension via the CWS API (see ADDED Requirement "Chrome Web Store API is the idempotency source of truth").
- Upload the extension zip, unless the CWS API state already has the current version in an `UPLOADED` or `PUBLISHED` draft (see ADDED Requirement "Upload and publish are separate, resumable steps").
- Poll for `UPLOADED` state before proceeding to publish.
- Publish the uploaded draft.
- Poll for `PUBLISHED` or `IN_REVIEW` terminal state (see ADDED Requirement "Post-publish verification").
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

## ADDED Requirements

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

#### Scenario: Tag and CWS state disagree

- **GIVEN** no `@kaiord/<ext>@<version>` git tag exists locally
- **AND** the CWS draft has `version == <version>` with `uploadState == UPLOADED` (a prior partial publish)
- **WHEN** the workflow runs
- **THEN** the workflow SHALL trust the CWS API state, skip upload, and proceed to publish

### Requirement: Post-publish verification

After `publish`, the workflow SHALL poll the CWS API (`GET /items/<id>?projection=PUBLISHED`) for up to 2 minutes. Rationale: this timeout confirms publish **dispatch** reached a terminal state, NOT end-user-review completion (which can take hours-to-days). 120 s is chosen as 2× the observed p95 publish-dispatch latency (30–60 s in prior successful runs logged on this repo); a tighter value would flap, a much larger value would delay `cws-publish-rejected` surfacing without making correct outcomes more reliable. On the first end-to-end run of the new flow (task 10.6), measured dispatch latency SHALL be recorded in the PR description; if it exceeds 90 s systematically, the constant is re-tuned in a follow-up PR. The poll SHALL terminate on any of four terminal states: `PUBLISHED`, `IN_REVIEW`, `REJECTED`, or `TIMEOUT` (no terminal state reached within the window).

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
- **AND** `wait-published` SHALL fail-fast: the elapsed wall-clock time from invocation to exit SHALL be `< 5 seconds`. NOT waiting the full 2-min timeout. Test 4.4 SHALL assert this timing bound (mock CWS returns REJECTED on the first poll; `Date.now()` delta from `wait-published` start to exit `< 5000` ms — generous to absorb fetch + JSON parse on slow runners). Without this assertion, an implementer could trivially "pass" the REJECTED scenario by polling out the full timeout and reporting status REJECTED at the end, defeating the fail-fast intent.
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

- **One-time setup**: Google Cloud project, service-account creation, JSON key generation, CWS Developer Dashboard linkage (Settings → Service accounts), `CWS_SERVICE_ACCOUNT_KEY` GitHub Secret upload, decommissioning of the three OAuth secrets.
- **Key rotation**: service-account JSON keys do not expire automatically; rotation is a maintainer-initiated security action. Procedure: generate a new key in Google Cloud Console, update `CWS_SERVICE_ACCOUNT_KEY`, revoke the old key.
- **Emergency re-publish**: how to use `workflow_dispatch` with `force_upload: true`.
- **Compromised-key response**: immediate rotation + audit of recent CWS activity via the Developer Dashboard.

The `cws-auth-broken` and `cws-publish-verification-timeout` issue bodies SHALL link to this runbook.

#### Scenario: Maintainer follows the runbook after a pre-flight failure

- **GIVEN** a `cws-auth-broken` issue is open
- **WHEN** the maintainer opens the issue
- **THEN** the body SHALL link to `docs/runbooks/cws-service-account.md`
- **AND** following the runbook's "Key rotation" section SHALL produce a new `CWS_SERVICE_ACCOUNT_KEY` value that passes pre-flight on the next `workflow_dispatch`
