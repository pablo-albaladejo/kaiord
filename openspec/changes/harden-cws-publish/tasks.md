## 1. Google Cloud service-account setup (one-time, maintainer)

> This section is the prerequisite human step. Implementation tasks (2+) depend on the service account and JSON key existing. The maintainer performs these manually; the runbook (task 8.x) will ultimately document them in reusable form.

- [ ] 1.1 In Google Cloud Console, create (or identify) a project dedicated to CWS automation. Note the project ID for the runbook.
- [ ] 1.2 In the project, create a service account (e.g., `kaiord-cws-publisher@<project>.iam.gserviceaccount.com`). Grant it NO project-level IAM roles — the only authority it needs is the CWS Developer Dashboard link.
- [ ] 1.3 Generate a JSON key for the service account. Download once; the file will be pasted into a GitHub Secret and never stored on disk after.
- [ ] 1.4 In the Chrome Web Store Developer Dashboard (https://chrome.google.com/webstore/devconsole), go to Settings → Service accounts → Add account. Paste the service-account email. This is Google's "one service account per publisher" linkage.
- [ ] 1.5 Add the JSON key content to the repo as secret `CWS_SERVICE_ACCOUNT_KEY` (Settings → Secrets and variables → Actions).
- [ ] 1.6 Keep the existing `CWS_EXTENSION_ID` and `CWS_TRAIN2GO_EXTENSION_ID` secrets. They are reused.
- [ ] 1.7 **Defer** removing `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` until task 9.x (after end-to-end verification of the new flow).

## 2. CWS API helper: auth + state

- [ ] 2.1.a Write failing `node --test` for `signJwt(serviceAccountJson)` — produces an RS256 JWT with `iss == client_email`, `scope == https://www.googleapis.com/auth/chromewebstore`, `aud == https://oauth2.googleapis.com/token`, `iat == now - 60`, `exp == now + 3600`. Verify signature with the public key from the JSON.
- [ ] 2.1.b Implement `signJwt` using `node:crypto.createSign('RSA-SHA256')` — no third-party deps.
- [ ] 2.2.a Write failing test for `mintAccessToken(serviceAccountJson)`: POSTs to `https://oauth2.googleapis.com/token` with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and the JWT; returns the 1-hour access token.
- [ ] 2.2.b Implement `mintAccessToken` using `globalThis.fetch`. Cache the token per-process for its lifetime (up to ~55 min, leaving 5 min safety margin).
- [ ] 2.3.a Write failing test for `getItem(id, projection)` — uses the cached access token; returns normalized `{ id, draft, published, reviewState, rawResponse }` on 2xx; throws typed `CwsAuthError` on 401/403, `CwsStateError` on other 4xx/5xx.
- [ ] 2.3.b Implement `getItem(id, projection)` against `https://www.googleapis.com/chromewebstore/v1.1/items/<id>?projection=<projection>`.
- [ ] 2.4.a Write failing test asserting typed errors surface stable message prefixes (`[CwsAuthError]`, `[CwsStateError]`, `[CwsTimeoutError]`) — the workflow greps these to decide whether to open the auth-broken issue vs the verification-timeout issue.
- [ ] 2.4.b Implement the typed error classes.
- [ ] 2.5 Header comment on `scripts/cws-api.mjs`: `// Requires Node >= 18 (fetch global, crypto.createSign); repo root pins >= 22.12`.
- [ ] 2.6 `CWS_API_BASE_URL = "https://www.googleapis.com/chromewebstore/v1.1"` as module-level constant. Documented in the helper header as a pragmatic Factor III deviation (single-endpoint service).

## 3. CWS API helper: upload + publish + polling

- [ ] 3.1.a Write failing test for `uploadCrx(id, zipPath)` — PUTs the zip body to `https://www.googleapis.com/upload/chromewebstore/v1.1/items/<id>` with `Content-Type: application/octet-stream`, `x-goog-api-version: 2`. Returns the CWS response `{ id, uploadState, itemError?, crxVersion? }`.
- [ ] 3.1.b Implement `uploadCrx` via `fetch` with `body: createReadStream(zipPath)` and `duplex: "half"` (Node fetch streaming body requirement).
- [ ] 3.2.a Write failing test for `publishItem(id, { deployPercentage=100, trustedTesters=false })` — POSTs to `https://www.googleapis.com/chromewebstore/v1.1/items/<id>/publish?publishTarget=<default|trustedTesters>`. Returns `{ status: [string] }`.
- [ ] 3.2.b Implement `publishItem`.
- [ ] 3.3.a Write failing test for `pollUntil(predicate, { timeoutMs, intervalMs=2000 })` — returns on first truthy predicate; throws `CwsTimeoutError` after `timeoutMs`.
- [ ] 3.3.b Implement `pollUntil` as a general helper used by both wait-uploaded and wait-published.
- [ ] 3.4.a Write failing test for CLI entry `node scripts/cws-api.mjs <sub> ...` — subcommands: `check`, `state`, `upload`, `publish`, `wait-uploaded`, `wait-published`. Each prints JSON to stdout on success, exits 0; typed errors go to stderr with the stable prefix; exit code 1 for recoverable, 2 for usage errors.
- [ ] 3.4.b Implement the subcommand dispatcher.

## 4. Test coverage + secret redaction

- [ ] 4.1 Add `scripts/cws-api.test.mjs` to the `test:scripts` glob. Cover success, 401, 403, 429, 5xx, malformed JSON, network error, timeout, clock skew (JWT `iat` 60s in the past), two sequential calls re-using the cached token. All fetches mocked via `globalThis.fetch = vi.fn()` or `undici.MockAgent`.
- [ ] 4.2 Write failing test asserting NO secret value (`private_key`, `access_token`, or any substring ≥32 chars of them) appears in stdout OR stderr across ALL exit paths (success, 401, 403, 429, 5xx, timeout, malformed JSON, JWT sign error). Factor XI complement: GitHub Actions secret-masking only catches exact matches of registered secrets — a JWT payload-segment leak (base64 fragment) would escape the runner's redaction.
- [ ] 4.3 Manual verification from a local checkout with `CWS_SERVICE_ACCOUNT_KEY` in the shell env: run each subcommand against the real CWS API; confirm output formats and exit codes.

## 5. Rewrite `cws-publish.yml`

- [ ] 5.1 Remove `chrome-webstore-upload-cli` from `packages/garmin-bridge/package.json` and `packages/train2go-bridge/package.json` devDeps. Run `pnpm install` to prune.
- [ ] 5.2 Rewrite `.github/workflows/cws-publish.yml`:
  - New `pre-flight` job: single step `node scripts/cws-api.mjs check $CWS_EXTENSION_ID`. Environment: `CWS_SERVICE_ACCOUNT_KEY`. On failure, run `scripts/cws-notify-issue.mjs cws-auth-broken` and fail.
  - Add `publish` matrix `needs: pre-flight`.
  - Add `workflow_dispatch` input `force_upload: boolean (default false)`.
  - Publish job steps per extension:
    1. Checkout + setup-pnpm + pnpm install
    2. Sync + package (`scripts/sync-extension-version.mjs` + `scripts/package-extension.sh`)
    3. **Query CWS state** (unless `inputs.force_upload == true`): `node scripts/cws-api.mjs state <id>`. Set outputs: `cws_draft_version`, `cws_draft_upload_state`, `cws_published_version`.
    4. **Upload** (skip if `force_upload == false` AND draft already `UPLOADED` at current version, OR published already at current version): `node scripts/cws-api.mjs upload <id> --source <zip>`.
    5. **Wait-uploaded** (skip same conditions as 4): `node scripts/cws-api.mjs wait-uploaded <id> --timeout-ms 60000`.
    6. **Publish** (skip only if published already at current version): `node scripts/cws-api.mjs publish <id>`.
    7. **Wait-published**: `node scripts/cws-api.mjs wait-published <id> --version <current> --timeout-ms 120000`. On success: tag. On IN_REVIEW or timeout: open `cws-publish-verification-timeout` issue scoped per-extension per-version and exit 0.
    8. **Git tag** (only on true PUBLISHED): `git tag @kaiord/<ext>@<version> && git push origin @kaiord/<ext>@<version>`.
- [ ] 5.3 Keep `fail-fast: false`, `concurrency: ${{ github.workflow }}-${{ github.ref }}`.
- [ ] 5.4 Remove all references to `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` in the workflow.
- [ ] 5.5 `actionlint` passes on the rewritten workflow.

## 6. Issue notification helper

- [ ] 6.1.a Write failing test for `scripts/cws-notify-issue.mjs <label> [<title-suffix>]`: searches existing open issues by EXACT title match (built from label + optional suffix), bumps via comment if present, creates if absent. Returns the issue number.
- [ ] 6.1.b Implement the helper using `gh api repos/:owner/:repo/issues` — single call to search by title, single call to create or comment.
- [ ] 6.2 Title conventions: `cws-auth-broken` → title `"CWS authentication broken"`. `cws-publish-verification-timeout` → title `"CWS publish stalled: @kaiord/<ext>@<version>"` (scoped so each stuck release is a separate issue).
- [ ] 6.3 Add `scripts/cws-notify-issue.test.mjs` to `test:scripts`. Cover: no existing issue → creates; existing open issue → bumps (comment added, no duplicate); existing closed issue with same title → creates new; two concurrent invocations → second sees first's issue via exact-title match (TOCTOU protection — see task 6.4).
- [ ] 6.4 **TOCTOU mitigation at workflow level**: add `concurrency: { group: cws-issue-writer, cancel-in-progress: false }` to `cws-publish.yml`. (The dedicated weekly token-health workflow is **not** created in this change — service accounts do not expire, so the proactive scheduled-check premise no longer applies. The concurrency group still prevents parallel matrix entries from racing on issue writes.)

## 7. Issue templates

- [ ] 7.1 `.github/ISSUE_TEMPLATE/cws-auth-broken.md`: title prefill `CWS authentication broken`, labels `cws-auth-broken`, assignees `pablo-albaladejo`. Body: observed error, link to runbook, checklist (rotate key via Google Cloud → update `CWS_SERVICE_ACCOUNT_KEY` → re-run pre-flight via `workflow_dispatch` → close issue).
- [ ] 7.2 `.github/ISSUE_TEMPLATE/cws-publish-verification-timeout.md`: title template `CWS publish stalled: @kaiord/<ext>@<version>`, labels `cws-publish-verification-timeout`. Body: last CWS state payload, link to CWS Developer Dashboard, note that `IN_REVIEW` is usually fine and self-resolves.

## 8. Runbook

- [ ] 8.1 Create `docs/runbooks/cws-service-account.md` with sections:
  - **One-time setup** (mirrors task 1.x with screenshots or step-by-step clickpaths where Chrome Web Store UI is involved).
  - **Key rotation** (optional, security best practice): generate new key → update secret → trigger `workflow_dispatch` pre-flight to verify → revoke old key. Timeline suggestion: annual or on any security event.
  - **Emergency re-publish**: Actions → "CWS Publish" → Run workflow → `force_upload: true` → Run. Note: `force_upload` BYPASSES the idempotency guard; only use when the shipped CRX is known-bad.
  - **Compromised-key response**: revoke the JSON key in Google Cloud Console IMMEDIATELY (does not require waiting to generate replacement); this will cause pre-flight to fail and open `cws-auth-broken`; then generate new key, update secret, audit CWS Developer Dashboard for unauthorized item submissions in the last N days.
  - **What this replaces**: a brief note that the repo used to use OAuth user-delegated refresh tokens (`CWS_CLIENT_ID` / `CWS_CLIENT_SECRET` / `CWS_REFRESH_TOKEN`). These secrets are no longer consulted; remove them from the repo Secrets screen after confirming the new flow works end-to-end.
- [ ] 8.2 Reference the runbook from `AGENTS.md` under a "Runbooks" index section (create section if absent).
- [ ] 8.3 Self-dogfood: the maintainer does tasks 1.x while following the runbook and updates any step that required off-runbook knowledge.

## 9. Decommission OAuth auth

- [ ] 9.1 After the first `cws-publish.yml` run with the new flow succeeds end-to-end (both extensions published or confirmed-already-at-current-version), remove `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` from repo Secrets.
- [ ] 9.2 Grep the repo for any remaining references to those env var names. Expected result: zero hits. Remove if any found.
- [ ] 9.3 Post a PR comment on the merged PR linking the first successful run in the new flow (public evidence for audit).

## 10. Quality gates

- [ ] 10.1 `pnpm test:scripts` — `cws-api.test.mjs` + `cws-notify-issue.test.mjs` pass; full scripts suite green.
- [ ] 10.2 `pnpm lint` — zero errors (including the existing Link checker gate).
- [ ] 10.3 `pnpm lint:specs` — all specs validate.
- [ ] 10.4 `npx openspec validate harden-cws-publish` — change is valid.
- [ ] 10.5 `actionlint .github/workflows/cws-publish.yml` — zero warnings.
- [ ] 10.6 End-to-end: `workflow_dispatch` against a test branch that bumps the extension version; confirm the new flow publishes both extensions, verify `cws-auth-broken` does NOT open, verify the correct git tag is written.
- [ ] 10.7 End-to-end with `force_upload: true`: confirm the idempotency guard is bypassed and upload runs even though CWS has the version.
- [ ] 10.8 Destructive test: temporarily set a bogus `CWS_SERVICE_ACCOUNT_KEY` in a test branch; confirm pre-flight fails in <10 s, the publish matrix is skipped, and a `cws-auth-broken` issue opens.

## 11. Documentation + archive

- [ ] 11.1 Update `AGENTS.md` section on CWS publish pipeline if present — note the service-account migration at a high level.
- [ ] 11.2 Update `openspec/specs/cws-auto-publish/spec.md` via `opsx-archive` after PR merge — the delta in this change modifies the existing capability.
- [ ] 11.3 Run `/opsx-verify harden-cws-publish` and resolve any spec-vs-implementation mismatches.
- [ ] 11.4 After PR merge, run `/opsx-archive harden-cws-publish`.
