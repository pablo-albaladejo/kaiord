## Context

The existing `.github/workflows/cws-publish.yml` publishes Chrome extensions via a single `chrome-webstore-upload-cli upload ... --auto-publish` call per extension in a 2-entry matrix. The "did we already publish this?" check compares `packages/<ext>/package.json` version against the latest `@kaiord/<ext>@*` git tag; if they match, the workflow skips.

That model has three structural weaknesses surfaced by the observed Apr 12–24 failure pattern:

1. **Tag is NOT the source of truth for CWS state.** A git tag is only written on successful publish. If upload succeeds and publish fails (partial write to CWS), the tag never gets created but CWS already has the new version. The next run sees `tag != package.json version`, retries the upload, and hits `PKG_INVALID_VERSION_NUMBER`. Observed 5+ times between Apr 12 and Apr 19.
2. **Token validity is only tested during upload.** A revoked refresh token fails the entire upload step after ~1 min of CI time. No pre-flight check; no proactive monitoring; the token's existence is only verified at the worst possible moment (mid-release).
3. **No post-publish verification.** Auto-publish is fire-and-forget. If Chrome's review queue holds the submission, the workflow reports success but the extension never reaches users. There is no way for the repo to distinguish "published" from "uploaded but awaiting review" from "rejected".

All three issues are solvable without adding new dependencies — the Chrome Web Store API is REST + OAuth2, and the existing secrets already grant the necessary scopes. A small helper script + workflow restructure closes the loop.

## Goals / Non-Goals

**Goals:**

- Detect token expiry before it causes a mid-release failure (fail-fast ≤10 s, auto-open a tracking issue).
- Make the publish flow resumable: upload and publish are separate steps; a failed publish does not trigger a duplicate upload on retry.
- Use the CWS API's `uploadState` / `draft.version` as the authoritative "has this version been uploaded?" check, subsuming the git tag comparison.
- Verify post-publish transition to `PUBLISHED` (or a review queue) within 2 minutes; auto-open an issue if it doesn't.
- Monitor token health proactively (weekly dry call) so expiry is surfaced as a low-priority issue days-to-weeks before the next release rather than as a release-blocker.
- Document the token-rotation procedure in-repo so the fix is ≤5 minutes when the issue fires.

**Non-Goals:**

- Switching away from `chrome-webstore-upload-cli` to a bespoke CWS client.
- Changing the changesets `linked` group configuration (extensions continue to bump alongside npm packages).
- Altering the matrix strategy (2 extensions remain separate entries with shared credentials).
- Adding retry-with-backoff for transient CWS API failures beyond what the upload CLI already does.
- Handling CRX-signing errors or manifest-validation errors (out of scope; those are extension-content issues, not publish-pipeline issues).
- Automating the token re-authentication itself (requires a human interacting with a browser OAuth flow; out of scope).
- Building a dashboard or centralized telemetry; the signal surface is GitHub Issues + workflow runs, which are already queryable.

## Decisions

### Decision 1: Add a `scripts/cws-api.mjs` helper as the single call site

**Choice:** Create a small ESM module that exposes the CWS API calls the workflows need: `getItem(id)`, `uploadItem(id, zipPath)`, `publishItem(id)`, `getDraft(id)`, `getPublished(id)`. Implemented via `node:fetch`, using `CWS_CLIENT_ID` / `CWS_CLIENT_SECRET` / `CWS_REFRESH_TOKEN` to mint an access token on each invocation.

**Rationale:**

- The workflows will call the CWS API in 4 places (pre-flight, post-upload verify, post-publish poll, weekly health). Inlining `curl` in YAML multiplies maintenance cost; a single script with `node --test` coverage is cheaper.
- Keeps the YAML readable — each step becomes `node scripts/cws-api.mjs <subcommand>`.
- Lets us unit-test the error mapping (401 → exit code X, 429 → retry, etc.) via `node --test`; the project already runs `pnpm test:scripts` in CI.
- Matches the existing pattern of repo-wide scripts under `scripts/` (archive, spec-format, tsup-watchdog, etc.).

**Alternatives considered:**

- *Inline `gh api` calls in YAML*: rejected — `gh` doesn't authenticate against Google OAuth out of the box.
- *Inline `curl + jq`*: rejected — verbose, harder to test, secret redaction is easier to get wrong than in a structured script.
- *Pull in the underlying `chrome-webstore-upload` library directly*: acceptable but adds a devDep usage pattern (currently only used transitively by the CLI). Writing ~80 lines of fetch against the documented REST API is simpler and version-independent.

**Layer impact:** Infrastructure (CI scripts).

**Node version requirement:** the helper uses `globalThis.fetch` (Node ≥18) and no third-party deps. Repo root `package.json` already pins `engines.node >= 22.12`, so CI is safe. The helper SHALL carry a header comment stating `// Requires Node >= 18 (fetch global); repo root pins >= 22.12` so that standalone script invocations (e.g., a future standalone bin) don't silently regress.

**CWS API base URL:** the helper hardcodes `https://www.googleapis.com/chromewebstore/v1.1` as a module-level constant, not an env var. A strict Factor III reading would require externalization, but there is only one Chrome Web Store endpoint and no alternate deploy target exists (no staging CWS). If Google ever ships a staging tier, extract to `CWS_API_BASE_URL` env var with the current value as default — at that point the refactor is ~5 lines. Recorded here as a deliberate pragmatic deviation from Factor III purism.

### Decision 2: Pre-flight token validation as the workflow's first real step

**Choice:** Add a `pre-flight` step (runs before `version` detection) that calls `getItem(extensionId)` and verifies a 200 response. On 401/403 (`invalid_grant` or equivalent), the step calls `gh issue create --label cws-token-refresh-needed --template cws-token-refresh.md` to open (or bump) a tracking issue, then fails the job with exit code 1. The step runs for every extension in the matrix independently — the same token backs both, but a single successful call per run is enough to validate.

**Rationale:**

- Moves the failure point from "minute of upload burned" to "5 seconds of API call". Faster signal, lower CI minute cost.
- Auto-issue creation removes the "who notices the failure?" tribal knowledge; anyone watching the issue tracker sees the problem.
- The issue template (see Decision 5) links to the runbook, turning a 20-minute scramble into a walkthrough.

**Alternatives considered:**

- *Do nothing; let the upload fail*: rejected — current behavior, observed to be poor.
- *Validate the token ONLY in the weekly health check*: rejected — a reactive fail-fast during release is still faster than "scroll up to see why upload failed".

**Layer impact:** Infrastructure (CI workflow step).

### Decision 3: Split upload from publish; use CWS state as the skip check

**Choice:** Replace the single `chrome-webstore-upload-cli upload --auto-publish` invocation with:

```
1. query CWS draft state:
   - if draft.version === package.json.version AND draft.uploadState === UPLOADED:
     → skip upload, proceed to publish
   - if published.version === package.json.version:
     → skip everything (already live)
   - else: continue to upload
2. upload (no --auto-publish):
   chrome-webstore-upload-cli upload --source <zip> --extension-id ... --client-id ... --client-secret ... --refresh-token ...
3. poll CWS draft state until uploadState === UPLOADED (timeout 60 s; usually <10 s)
4. publish:
   chrome-webstore-upload-cli publish --extension-id ... --client-id ... --client-secret ... --refresh-token ...
5. poll CWS published state until version === package.json.version OR reviewState === IN_REVIEW (timeout 120 s)
6. on step-5 timeout, open a GitHub issue tagged cws-publish-verification-timeout with the last-seen state payload; do NOT fail the workflow (extension may be legitimately in manual review; failing would block the next release for a non-actionable reason)
```

**Rationale:**

- Step 1 eliminates the `PKG_INVALID_VERSION_NUMBER` class of failures at its source.
- Steps 2–3 make the upload fully verifiable: we know the CRX reached CWS before attempting to publish.
- Step 5 closes the "silent review queue" gap; the workflow reports truthful state instead of green-on-unknown.
- Step 6 is a deliberate non-failure: manual review is the single observed reason for the 2-min poll to time out; treating it as a workflow failure would block subsequent releases (including hotfixes to other packages) unnecessarily.

**Alternatives considered:**

- *Keep `--auto-publish` and just add post-publish polling*: rejected — doesn't solve duplicate upload. The split is what unlocks resumability.
- *Fail the workflow on step-5 timeout*: rejected for the reason above.
- *Retry publish on transient failure*: the CLI already retries. Not adding a second retry layer.

**Layer impact:** Infrastructure (CI workflow step rewrite).

### Decision 4: Weekly token-health monitor via `workflow: schedule`

**Choice:** New workflow `.github/workflows/cws-token-health.yml`, cron `0 9 * * 1` (Monday 09:00 UTC). Calls `node scripts/cws-api.mjs check` which hits `getItem(extensionId)` for a stable extension (`CWS_EXTENSION_ID`). On non-2xx, opens (or bumps) a `cws-token-refresh-needed` issue — the same label the reactive fail-fast (Decision 2) uses, so the two signals converge. On success, the workflow exits silently; no no-op comments.

**Rationale:**

- Converts a 6-monthly surprise into a ≤7-day lead time for the maintainer to act.
- Zero-cost when the token is healthy (one successful API call per week).
- Sharing the issue label / template with the reactive path means there's one queue to monitor, not two.

**Alternatives considered:**

- *Daily cadence*: rejected — probably overkill; weekly is the coarsest interval that still beats the release cadence.
- *Cron during business hours in a specific timezone*: rejected — issue creation is async; UTC keeps the schedule simple.
- *Use `googleapis` SDK for a richer health check*: rejected — adds a heavyweight dep for a single call; the same REST fetch as the helper suffices.

**Layer impact:** Infrastructure (new scheduled workflow).

### Decision 5: One GitHub issue template covers both failure paths

**Choice:** New `.github/ISSUE_TEMPLATE/cws-token-refresh.md` with sections for:

- Observed error (templatable via workflow-dispatch input)
- Link to `docs/runbooks/cws-token-rotation.md`
- Check-off list: (a) revoke old token at console.cloud.google.com; (b) run `chrome-webstore-upload-cli init`; (c) paste new `refresh_token` into `CWS_REFRESH_TOKEN` secret; (d) trigger `cws-token-health` via `workflow_dispatch` to verify; (e) close this issue.

The issue opens with the `cws-token-refresh-needed` label and auto-assigns to the `@pablo-albaladejo` CODEOWNER for the CI workflows path. Subsequent detections update the existing issue body with a new timestamp rather than opening duplicates.

**TOCTOU mitigation (open-or-bump race):**

The naive "open-or-bump" pattern is `gh issue list` (CHECK) → conditional `gh issue create` or `gh issue comment` (USE). If the reactive path (`cws-publish.yml` pre-flight) and the proactive path (`cws-token-health.yml` weekly cron) fire within seconds of each other (plausible if a Monday-morning merge coincides with the 09:00 UTC cron), both can see "no open issue" at check time and both create one at use time. Result: duplicate issues.

The mitigation is a **shared concurrency group** across BOTH workflows:

```yaml
# In cws-publish.yml AND cws-token-health.yml
concurrency:
  group: cws-issue-writer
  cancel-in-progress: false   # do not cancel an in-flight run
```

With `cancel-in-progress: false`, the second workflow's job queues behind the first; when the first finishes, the second sees the real (just-updated) issue state before doing its own check. Race eliminated.

Defense-in-depth: the open-or-bump script also queries by **exact issue title** (not just label) — `CWS token refresh needed` — so even if a label-only approach would have produced a duplicate, the title check catches it.

**Rationale:**

- One procedure, one template, one issue — less context switching.
- The checklist format makes mid-rotation interruption safe (you can see exactly where you left off).
- Anchoring the runbook from the issue shortens the path-to-fix.

**Alternatives considered:**

- *Separate templates for reactive vs proactive*: rejected — same problem, same fix, same runbook; splitting creates duplicates.
- *Slack / email alerting*: out of scope (no existing alerting infra in this repo; issue-as-queue is sufficient for a solo-maintainer project).
- *Accept the TOCTOU race and de-dupe manually*: rejected — violates Factor XII (admin processes should be idempotent).
- *Retry-loop with exponential backoff around create*: rejected — serializing via concurrency group is simpler AND deterministic.

**Layer impact:** Documentation / repo ops.

### Decision 6: Keep the matrix; the secrets; the `fail-fast: false`

**Choice:** Do NOT refactor the matrix, the shared-credentials approach, or the `fail-fast: false` strategy. Those are spec-locked in `cws-auto-publish` and working as intended — one extension's failure should not block the other's publish.

**Rationale:**

- Preserves the existing capability contract; reviewers don't have to re-learn the workflow layout.
- Minimizes the blast radius of this change.

**Layer impact:** None (explicitly not changing).

## Risks / Trade-offs

- **[Risk] Adding pre-flight + post-publish polling adds ~30 s to each successful run** → Acceptable. CI minutes on publish are cheap (the workflow runs at most a few times per week on merge) and the polls short-circuit on success. The wall-clock tradeoff vs a minute of burned upload + a human-hour of triage is favorable.
- **[Risk] The CWS API's `uploadState` / `draft.version` semantics are under-documented** → Mitigation: the helper script normalizes the three states we care about (`UPLOADED`, `PUBLISHED`, `IN_REVIEW`) and treats anything else as "state unclear → open an issue with the raw payload". Running against the real API in the token-health check (Decision 4) surfaces any surprise quickly.
- **[Risk] Auto-issue creation could spam the tracker (TOCTOU race)** → Two-part mitigation: (a) both `cws-publish.yml` and `cws-token-health.yml` share a `concurrency: { group: cws-issue-writer, cancel-in-progress: false }` declaration so overlapping runs serialize instead of racing check-then-create; (b) the open-or-bump script queries by exact issue title (not just label) so even accidental duplicates get caught at the next detection and merged. The post-publish-timeout case (Decision 3, step 6) uses a different label (`cws-publish-verification-timeout`) per-extension per-version so each stuck release gets its own actionable record.
- **[Risk] The helper script's own bugs could brick publishes** → Mitigation: `scripts/cws-api.test.mjs` under `pnpm test:scripts` covers success / 401 / 403 / 429 / 5xx / malformed-JSON paths via fetch mocking. The script is small (<100 lines) and lives next to the workflow it serves.
- **[Trade-off] Token-rotation remains manual** → Google's OAuth flow requires browser interaction; no automated path exists. The documented runbook is the cheapest mitigation.
- **[Trade-off] Adding a weekly scheduled workflow consumes a tiny amount of CI quota** → ~1 minute / week. Negligible.
- **[Trade-off] `chrome-webstore-upload-cli publish` vs direct CWS API call** → Keeping the CLI for the publish step (not only upload) preserves the existing mental model and avoids re-implementing another documented-but-quirky API call. The helper handles state-inspection only; writes still go through the CLI.
- **[Trade-off] Factor X gap: no staging Chrome Web Store tier exists** → Acknowledged limitation. Google does not offer a staging CWS; every end-to-end verification (task 7.5) touches production. Mitigations: (a) extensive fetch-mocked unit tests of the helper cover the full state machine (`UPLOADED` / `PUBLISHED` / `IN_REVIEW` / errors); (b) end-to-end verification is scheduled alongside a real intended release rather than speculatively; (c) `workflow_dispatch` in `cws-token-health` allows non-destructive token validation at any time without uploading anything. If Google ever ships a staging CWS tier, the `CWS_API_BASE_URL` extraction (see Decision 1's Node/URL note) unlocks dual-environment testing in ~5 LOC.
- **[Trade-off] Emergency force-republish of the same version** → The CWS-state-as-source-of-truth idempotency (Decision 3) skips re-upload when CWS already has the current `package.json` version. If the uploaded CRX is later known-bad (silent build regression, post-publish malware-scan rejection, credential leak in the bundle) the dev needs to force the same version back through the pipeline. Mitigation: `cws-publish.yml`'s `workflow_dispatch` gains a `force_upload: boolean` input; when `true`, the state-check step is bypassed and upload runs unconditionally. Default `false` preserves the normal guard. Documented in the runbook.
