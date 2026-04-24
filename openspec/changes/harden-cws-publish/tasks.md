## 1. CWS API helper script

- [ ] 1.1.a Write failing `node --test` covering `getAccessToken` success path: POST to Google OAuth with refresh token returns a 200 with `access_token`; helper caches the token for the run duration.
- [ ] 1.1.b Implement `scripts/cws-api.mjs` exporting `getAccessToken(env)` — uses `node:fetch`, no third-party deps.
- [ ] 1.1.c Header comment on `scripts/cws-api.mjs`: `// Requires Node >= 18 (fetch global). Repo root pins >= 22.12 via engines.node;` — belt-and-braces for standalone invocations outside the monorepo CI.
- [ ] 1.1.d CWS API base URL (`https://www.googleapis.com/chromewebstore/v1.1`) is a module-level constant, NOT an env var (Factor III pragmatic: only one CWS endpoint exists; see design Decision 1's pragmatic-deviation note).
- [ ] 1.2.a Write failing test for `getItem(id, projection)` success (200 returns normalized `{ id, draft, published, reviewState }`) AND 401/403 failure paths (throws a typed `CwsAuthError` with a stable message string the workflow can grep for).
- [ ] 1.2.b Implement `getItem` using the token from 1.1.b; map 2xx / 4xx / 5xx to `{ ok, body }` or typed throws.
- [ ] 1.3.a Write failing test for `pollUntil(predicate, { timeoutMs, intervalMs })` returning on first truthy predicate or throwing `CwsTimeoutError` after `timeoutMs`.
- [ ] 1.3.b Implement the polling helper; used by post-upload verify AND post-publish verify.
- [ ] 1.4.a Write failing test for CLI entry point `node scripts/cws-api.mjs <subcommand> <extensionId>`: subcommands `check` (pre-flight), `get-draft`, `get-published`, `wait-uploaded`, `wait-published`. Each prints JSON to stdout and exits 0 on success, non-zero on typed errors, with the error TYPE in stderr (not the secret).
- [ ] 1.4.b Implement the subcommand dispatcher.
- [ ] 1.5 Add `scripts/cws-api.test.mjs` to the `test:scripts` glob; verify `pnpm test:scripts` runs it and it covers success, 401, 403, 429, 5xx, malformed JSON, network error, timeout. All fetches mocked via `globalThis.fetch = vi.fn()` or `undici.MockAgent`.
- [ ] 1.5.a Write failing test asserting NO secret value (`client_secret`, `refresh_token`, `access_token`, or any substring ≥12 chars of them) appears in stdout OR stderr across ALL exit paths (success, 401, 403, 429, 5xx, timeout, malformed JSON). Factor XI complement: GitHub Actions secret-masking only catches exact matches of registered secrets, so a JWT payload split or partial-decode leak would escape the runner's redaction — test it at the source.
- [ ] 1.6 Manual verification: from a checkout with valid secrets exported to the shell, run each subcommand against the real CWS API; confirm responses parse and exit codes are correct.

## 2. Pre-flight integration in `cws-publish.yml`

- [ ] 2.1.a Write an E2E-style failing test via `act` (or equivalent local runner) with a stubbed CWS endpoint returning 401; confirm the workflow fails at the pre-flight step, does NOT reach `Setup pnpm`, and creates the issue. If `act` coverage is impractical, document the manual verification alternative in the PR description.
- [ ] 2.1.b Add a `pre-flight` job that runs BEFORE the main `publish` matrix; calls `node scripts/cws-api.mjs check $CWS_EXTENSION_ID`. `publish` gains `needs: pre-flight`.
- [ ] 2.2.a Write failing test asserting that on a 4xx auth error, `gh issue list --label cws-token-refresh-needed` is consulted and if a matching open issue exists, that issue is updated with a new timestamp comment rather than a duplicate being created.
- [ ] 2.2.b Implement the issue-open-or-bump logic in a small `scripts/cws-notify-token.mjs` (called from pre-flight on failure).
- [ ] 2.2.c TOCTOU mitigation: the open-or-bump script searches for an existing issue by EXACT title match (`CWS token refresh needed`), NOT just by label, so label-only queries that race against two concurrent writers don't deduplicate incorrectly. Write a failing test simulating two concurrent invocations that both see "no issue" at CHECK time; assert the second invocation detects the issue created by the first via title match and bumps instead of creating a duplicate.
- [ ] 2.2.d Add `concurrency: { group: cws-issue-writer, cancel-in-progress: false }` to BOTH `cws-publish.yml` and `cws-token-health.yml` (task 5.1) so overlapping workflow runs serialize on the issue-writer — eliminates the TOCTOU race at the workflow layer. The `cancel-in-progress: false` is critical: a mid-flight issue creation MUST complete, not get cancelled.
- [ ] 2.3 Verify the pre-flight step does NOT check out code (`actions/checkout` is not required for the API call; checkouts add ~2 s and are unnecessary).

## 3. Upload / publish split in `cws-publish.yml`

- [ ] 3.1.a Write failing test for the "skip upload if CWS already has this version" branch: given `getItem()` returns `draft.version == package.json.version && draft.uploadState == UPLOADED`, the upload step is skipped and the workflow proceeds to publish.
- [ ] 3.1.b Add a "query CWS state" step BEFORE the upload step that sets outputs: `cws_current_version`, `cws_upload_state`, `cws_published_version`. Upload step gains `if:` that compares these outputs to `steps.version.outputs.current`.
- [ ] 3.1.c Add `force_upload: boolean (default false)` as a `workflow_dispatch` input. When `true`, the "query CWS state" step is bypassed and the upload step runs unconditionally regardless of `draft.uploadState`. This enables emergency re-publishes of the same version (silent build regression, credential leak in a published bundle, post-publish malware-scan rejection). Document the input in `docs/runbooks/cws-token-rotation.md` (task 6.2) under a new "Emergency re-publish" section so the escape hatch is discoverable.
- [ ] 3.2 Remove `--auto-publish` from the upload step; it becomes `chrome-webstore-upload-cli upload ...` only.
- [ ] 3.3.a Write failing test: after upload, a new "wait for uploaded state" step polls `getItem()` until `draft.uploadState == UPLOADED` (timeout 60 s). On timeout, the workflow fails with a clear message.
- [ ] 3.3.b Implement the wait step via `node scripts/cws-api.mjs wait-uploaded <id> --timeout-ms 60000`.
- [ ] 3.4 Add a new "publish" step: `chrome-webstore-upload-cli publish --extension-id ... --client-id ... --client-secret ... --refresh-token ...`.
- [ ] 3.5 Move the "create @kaiord/<ext>@<version> git tag" step to run AFTER post-publish verification (task 4.x), not after upload — the tag now represents "verified live or accepted in review", not "uploaded".

## 4. Post-publish verification

- [ ] 4.1.a Write failing test for the happy path: after publish, polling `getItem(id, 'PUBLISHED')` sees `published.version == package.json.version` within 2 min; the workflow proceeds to git-tag creation and exits success.
- [ ] 4.1.b Implement via `node scripts/cws-api.mjs wait-published <id> --version $CURRENT --timeout-ms 120000`.
- [ ] 4.2.a Write failing test for the "review queue" path: within 2 min, CWS reports `reviewState: IN_REVIEW` (not yet published). The workflow SHALL open an issue labelled `cws-publish-verification-timeout` with the last state payload AND succeed (not fail).
- [ ] 4.2.b Implement the in-review detection and non-blocking issue opening.
- [ ] 4.3.a Write failing test for the "silent stall" path: after 2 min, CWS reports neither `PUBLISHED` nor `IN_REVIEW`. Same issue-open-non-blocking behavior as 4.2.
- [ ] 4.3.b Implement (shared code path with 4.2.b).
- [ ] 4.4 Ensure per-extension, per-version issue idempotency: the issue title includes `@kaiord/<ext>@<version>` so two stuck versions produce two distinct issues (tracked independently).

## 5. Weekly `cws-token-health.yml` workflow

- [ ] 5.1 Create `.github/workflows/cws-token-health.yml` with `on: { schedule: [{ cron: '0 9 * * 1' }], workflow_dispatch: {} }` AND `concurrency: { group: cws-issue-writer, cancel-in-progress: false }` (shared with `cws-publish.yml` per task 2.2.d — prevents TOCTOU races on the `cws-token-refresh-needed` issue when the weekly cron coincides with a reactive publish).
- [ ] 5.2 Single job: `node scripts/cws-api.mjs check $CWS_EXTENSION_ID`. On non-zero exit, call `scripts/cws-notify-token.mjs` (same logic as pre-flight failure; opens or bumps the `cws-token-refresh-needed` issue).
- [ ] 5.3 On success, the workflow SHALL exit silently — no artefacts, no comments, no success notification.
- [ ] 5.4 Verify permissions: `contents: read, issues: write` (needed to bump the issue); no write to code.
- [ ] 5.5 Manually trigger the workflow via `workflow_dispatch` once on a healthy token to confirm exit-silent behavior.
- [ ] 5.6 Manually trigger with a deliberately-broken secret (or simulate via local `act`) to confirm the issue opens.

## 6. Issue template + runbook

- [ ] 6.1 Create `.github/ISSUE_TEMPLATE/cws-token-refresh.md` with YAML frontmatter (labels: `cws-token-refresh-needed`, assignees: `pablo-albaladejo`) and a body containing:
  - Observed error (templated via `workflow-dispatch` inputs or workflow-computed string)
  - Link to `docs/runbooks/cws-token-rotation.md`
  - Checklist: revoke old token in Google Cloud; run `chrome-webstore-upload-cli init`; paste into `CWS_REFRESH_TOKEN` secret; trigger `cws-token-health` dispatch to verify; close this issue.
- [ ] 6.2 Create `docs/runbooks/cws-token-rotation.md` covering:
  - Google Cloud project name (`kaiord-cws-publisher` or whatever the current one is)
  - OAuth client name + scopes (`https://www.googleapis.com/auth/chromewebstore`)
  - Exact CLI: `npx chrome-webstore-upload-cli init` (or the `refresh-token` subcommand, whichever is current)
  - How to retrieve the new `refresh_token` from the CLI output
  - Exact GitHub repo Settings path to paste it at: Settings → Secrets and variables → Actions → `CWS_REFRESH_TOKEN` → Update secret
  - Verification: Actions → "CWS Token Health" → Run workflow (workflow_dispatch), expect success within 30 s
  - **Section "Emergency re-publish"**: when a published CRX is known-bad (silent build bug, credential leak, malware-scan rejection), trigger `cws-publish.yml` via `workflow_dispatch` with `force_upload: true` to bypass the CWS-state idempotency check and re-upload the same version. Document the exact Actions UI path and note that this is a break-glass procedure — normal releases never need it.
- [ ] 6.3 Add a reference to the runbook from `AGENTS.md` (under "Critical runbooks") and from the existing CWS section of `CLAUDE.md` if there is one.
- [ ] 6.4 Proofread the runbook against a real token rotation performed by the author (self-dogfood) — any step that required off-runbook knowledge is a missing step.

## 7. Quality gates

- [ ] 7.1 `pnpm test:scripts` — `cws-api.test.mjs` and `cws-notify-token.test.mjs` pass; full scripts suite green.
- [ ] 7.2 `pnpm lint:specs` — 25/25 (new spec + sync).
- [ ] 7.3 `npx openspec validate harden-cws-publish` — change is valid.
- [ ] 7.4 `actionlint .github/workflows/cws-publish.yml .github/workflows/cws-token-health.yml` — zero warnings.
- [ ] 7.5 On a test branch, trigger `cws-publish.yml` via `workflow_dispatch` against the current production secrets (once the maintainer rotates the token to close the existing outage); confirm the new flow publishes `garmin-bridge` and `train2go-bridge` end-to-end.
- [ ] 7.6 Capture a successful run's log as evidence in the PR description (redacted).

## 8. Documentation + rollout

- [ ] 8.1 Update `AGENTS.md` / `CLAUDE.md` if they document the CWS publish pipeline — note the pre-flight + verification changes briefly.
- [ ] 8.2 Post a pre-merge PR-description paragraph summarizing the observed failure history (with run IDs) so the context is captured in git archaeology, not lost in a Slack thread.
- [ ] 8.3 After the first successful end-to-end publish with the new flow, open a quick-win PR to update the runbook's "Verification" section with any friction the author hit.
- [ ] 8.4 Run `/opsx-verify harden-cws-publish` and resolve any spec-vs-implementation mismatches.
- [ ] 8.5 After PR merge, run `/opsx-archive harden-cws-publish` and sync the delta into `openspec/specs/cws-auto-publish/spec.md`.
