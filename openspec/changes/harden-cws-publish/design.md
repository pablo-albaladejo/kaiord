## Context

The existing `.github/workflows/cws-publish.yml` publishes Chrome extensions via a single `chrome-webstore-upload-cli upload ... --auto-publish` call per extension in a 2-entry matrix. It authenticates with Google via OAuth 2.0 **user-delegated refresh tokens** (`CWS_CLIENT_ID` + `CWS_CLIENT_SECRET` + `CWS_REFRESH_TOKEN`). The "did we already publish this?" check compares `packages/<ext>/package.json` version against the latest `@kaiord/<ext>@*` git tag; if they match, the workflow skips.

That model has **three structural weaknesses** surfaced by the observed Apr 12–24 failure pattern:

1. **OAuth refresh-token auth is inherently fragile for server-to-server use.** Google's user-delegated OAuth treats the CI as a web application — refresh tokens expire after ~6 months of inactivity (per Google's published policy for unverified or low-traffic apps), they can be revoked by password changes, OAuth consent-screen reconfigurations, or Google-side security actions. Renewal requires a human at a browser doing the full OAuth consent flow. There is no automated path. Observed: `invalid_grant` on 2026-04-24.

2. **Git tag is NOT the source of truth for CWS state.** A git tag is only written on successful publish. If upload succeeds and publish fails (partial write to CWS), the tag never gets created but CWS already has the new version. The next run sees `tag != package.json.version`, retries the upload, and CWS returns `PKG_INVALID_VERSION_NUMBER`. Observed 5+ times between Apr 12 and Apr 19.

3. **No post-publish verification.** Auto-publish is fire-and-forget. If Chrome's review queue holds the submission, the workflow reports success but the extension never reaches users. The repo cannot distinguish "published" from "uploaded but awaiting review" from "rejected".

The Chrome Web Store API **also supports Google Cloud service-account authentication** (https://developer.chrome.com/docs/webstore/service-accounts) — the same auth model fastlane-supply uses for the Google Play Store: a JSON private key signs a short-lived JWT which is exchanged for a 1-hour access token. The service-account JSON key **does not expire** (keys persist until the maintainer rotates or revokes them, which is optional and entirely under repo control). A single service account can be linked per CWS publisher — no Chrome Web Store Group ownership is required per the docs.

This change replaces the fragile OAuth user-flow auth with service-account auth AND addresses the two orthogonal structural issues (git-tag-as-idempotency-proxy, missing post-publish verification) in the same pass.

## Goals / Non-Goals

**Goals:**

- Eliminate OAuth refresh-token fragility by migrating to service-account JWT auth — no more periodic token expiry.
- Make the publish flow resumable: upload and publish are separate steps; a failed publish does not trigger a duplicate upload on retry.
- Use CWS API state (`draft.uploadState`, `draft.version`, `published.version`) as the authoritative idempotency check; the git tag becomes an *output* of a successful publish, not an *input* to the next run.
- Verify post-publish transition within 2 minutes; auto-open a tracking issue if the extension enters manual review rather than going live.
- Provide an emergency `force_upload` override for cases where the CWS-state idempotency would incorrectly skip a needed re-upload (known-bad CRX, credential leak in a shipped bundle, malware-scan rejection).
- Document the one-time service-account setup and the rare key-rotation procedure in a single runbook.

**Non-Goals:**

- Keeping `chrome-webstore-upload-cli` as a dependency — it does not support service accounts; we absorb its functionality into the helper.
- Contributing service-account support upstream to `chrome-webstore-upload-cli` — larger scope, blocks on external release cadence.
- Retaining the OAuth refresh-token auth path as a fallback — dual auth paths double the test surface and defer the real fix. Rollback, if needed, is via git-revert.
- Automating the Google Cloud service-account creation itself — Terraforming it is possible (gcloud, Google Cloud IaC) but over-engineered for a one-time ≤15-minute setup. Documented in the runbook.
- Automating key rotation — service-account keys do not expire; rotation is a maintainer-initiated security action, not a required scheduled task. If a scheduled rotation policy is ever adopted (e.g., quarterly), that becomes a separate future change.
- Adding Chrome-sync / publish-metrics telemetry — orthogonal.
- Adding Firefox / Edge add-on stores — orthogonal; each has its own auth model.

## Decisions

### Decision 1: Migrate auth to Google Cloud service account (JWT flow)

**Choice:** The maintainer performs a one-time Google Cloud setup:

1. In Google Cloud Console, create (or reuse) a project dedicated to CWS automation.
2. In that project, create a service account (e.g., `kaiord-cws-publisher@<project>.iam.gserviceaccount.com`).
3. Generate a JSON key for the service account and store it as the `CWS_SERVICE_ACCOUNT_KEY` GitHub Secret (repo-level).
4. In the Chrome Web Store Developer Dashboard, link the service account to the publisher account (Settings → Service accounts → Add account). This grants the service account permission to manage items owned by the publisher. Limit documented by Google: **one service account per publisher**.
5. Remove the prior secrets `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` after the new flow is verified end-to-end.

At runtime, the helper:

1. Reads `CWS_SERVICE_ACCOUNT_KEY` (JSON content), parses the private key.
2. Signs a JWT (`alg: RS256`) with the token-request claims (`iss`, `scope: https://www.googleapis.com/auth/chromewebstore`, `aud`, `exp`, `iat`).
3. POSTs to Google's token endpoint (`https://oauth2.googleapis.com/token`) with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and the signed JWT.
4. Receives a 1-hour access token.
5. Uses that token in `Authorization: Bearer ...` headers for all CWS API calls.

No refresh tokens. No 6-month expiry. No browser flow. If a human invalidates the key (revokes from Google Cloud Console) or unlinks the service account from the CWS Developer Dashboard, API calls fail with 401/403 — the pre-flight (Decision 3) catches this in ≤5 s.

**Rationale:**

- Matches the standard Google Cloud auth pattern used by BigQuery, Firestore, Pub/Sub, and every Cloud product designed for server-to-server access. Tooling (gcloud, `google-auth-library-nodejs`) exists but we don't need it — JWT signing with Node's `crypto` module is ~10 LOC.
- Eliminates the class of failure (`invalid_grant`) that caused Apr 24's outage.
- fastlane-supply (Android) uses exactly this pattern for Play Store; proven at immense scale. There is no structural reason CWS automation can't meet the same bar.

**Alternatives considered:**

- *Keep OAuth refresh tokens + add monitoring/runbook*: rejected — treats the symptom (tokens expire) instead of the cause (wrong auth model for CI).
- *Short-lived OAuth with `workload_identity_federation`*: considered — would work, but adds a layer (WIF provider config) for no incremental benefit over plain service-account JSON key when the runner is GitHub Actions-hosted. Worth revisiting if the repo ever moves to a self-hosted or fork-reviewable CI model where secret exposure is a real concern.
- *Impersonation via `gcloud auth print-access-token` on every run*: considered — requires `gcloud` installed on the runner and an OIDC configured between GitHub Actions and Google Cloud; more moving parts than JSON-key + JWT.

**Layer impact:** Infrastructure (workflow + helper); ops (one-time Google Cloud setup).

### Decision 2: Absorb `chrome-webstore-upload-cli` into `scripts/cws-api.mjs`

**Choice:** The CLI does not support service-account auth. Rather than fork upstream and wait on a release, implement the upload and publish flows directly against the Chrome Web Store REST API inside a new `scripts/cws-api.mjs` helper. The helper is a single ESM module with `node:fetch`, `node:crypto`, `node:fs`, `node:path` — no third-party deps.

Helper public surface:

```
node scripts/cws-api.mjs <subcommand> [flags]

subcommands:
  check   <extension-id>                             # pre-flight auth + access
  state   <extension-id>                             # print current CWS state JSON
  upload  <extension-id> --source <zip-path>         # upload a CRX (no publish)
  publish <extension-id> [--deploy-percentage=100]   # publish the uploaded draft
  wait-uploaded <extension-id> --timeout-ms N
  wait-published <extension-id> --version V --timeout-ms N
```

All subcommands print structured JSON to stdout on success (parseable by workflow steps via `jq` or `node -e`), diagnostic strings to stderr on errors (typed — `CwsAuthError`, `CwsStateError`, `CwsTimeoutError` — with stable message prefixes). Exit codes: `0` success, `1` recoverable error (open tracking issue), `2` usage error (invalid args, unreachable config).

**Rationale:**

- Keeps the workflow YAML readable: each step is one subcommand invocation.
- Testable: `scripts/cws-api.test.mjs` under `pnpm test:scripts` mocks `fetch` to cover success / 401 / 403 / 429 / 5xx / timeout / malformed-JSON paths, including secret-redaction assertions.
- Version-independent: no upstream package to bump and re-test on every minor release.
- ~120–150 LOC total: the CWS API surface we need (4 endpoints) plus JWT signing is genuinely small.

**Alternatives considered:**

- *Use `googleapis` npm SDK*: adds 30+ MB of transitive deps for one API; rejected.
- *Use `@fregante/chrome-webstore-upload` library directly*: same OAuth limitation as the CLI; would still need to bolt on JWT auth.
- *Fork `chrome-webstore-upload-cli`*: rejected — upstream release cadence is not our call; absorbing the ~80 lines of upload/publish logic is cheaper and more maintainable in-repo.

**Node version requirement:** the helper uses `globalThis.fetch` (Node ≥18) and `crypto.createSign` for JWT signing. Repo root `package.json` already pins `engines.node >= 22.12`. The helper SHALL carry a header comment `// Requires Node >= 18 (fetch global, crypto.createSign); repo root pins >= 22.12`.

**CWS API base URL:** `https://www.googleapis.com/chromewebstore/v1.1` is a module-level constant, not an env var. There is only one CWS endpoint globally; no staging tier exists (Factor X inherent gap, see Risks). If Google ever ships an alternative, extract to `CWS_API_BASE_URL` with the current value as default — a ~5-line refactor.

**Layer impact:** Infrastructure (new helper + tests; removes a devDep).

### Decision 3: Pre-flight auth check as the workflow's first real step

**Choice:** Add a `pre-flight` job that runs BEFORE the main `publish` matrix. Calls `node scripts/cws-api.mjs check $CWS_EXTENSION_ID` — performs JWT sign, token exchange, and a `getItem` call against CWS. On any 2xx, exits 0 and the `publish` matrix runs. On 4xx (service-account key invalid, account not linked in CWS Dashboard, quota exceeded, etc.), exits non-zero, calls `scripts/cws-notify-issue.mjs` to open-or-bump a tracking issue labelled `cws-auth-broken` with the last-seen error and a link to the runbook. The `publish` matrix has `needs: pre-flight`.

**Rationale:**

- Moves the failure point from "minute of upload burned" to "5 seconds of API call".
- Surfaces the problem in a persistent queue (GitHub Issues) rather than a workflow log scroll.
- Covers both "forgot to rotate a compromised key" and "CWS Developer Dashboard revoked the service-account linkage" in a single check — both manifest as 401/403 on `getItem`.

**Alternatives considered:**

- *No pre-flight, rely on upload failure*: rejected — current behavior, observed poor.
- *Split pre-flight per extension in the matrix*: rejected — same service-account credentials for both extensions; one check per workflow run is sufficient.

**Layer impact:** Infrastructure (workflow step).

### Decision 4: Split upload from publish; CWS state is the idempotency source of truth

**Choice:** Replace the single `chrome-webstore-upload-cli --auto-publish` call with:

```
1. query CWS draft + published state:
     if published.version >= package.json.version  → skip all (already live)
     if draft.version == package.json.version
        AND draft.uploadState == UPLOADED          → skip upload, go to publish
     else                                          → proceed to upload

   BYPASS: if workflow_dispatch input force_upload=true, skip this query.

2. upload:
     node scripts/cws-api.mjs upload  <id> --source <zip>

3. wait-uploaded:
     node scripts/cws-api.mjs wait-uploaded <id> --timeout-ms 60000
     (polls CWS draft.uploadState until UPLOADED or timeout)

4. publish:
     node scripts/cws-api.mjs publish <id>

5. wait-published:
     node scripts/cws-api.mjs wait-published <id> \
       --version $PKG_VERSION --timeout-ms 120000
     Success criteria (either):
       published.version == package.json.version   → live
       reviewState == IN_REVIEW                    → manual review queue
     Neither within timeout → open cws-publish-verification-timeout
                                 issue (scoped per-extension per-version),
                                 exit 0 (non-blocking).

6. git tag:
     only on (published.version == package.json.version)
     — IN_REVIEW does NOT tag (not yet live).
```

**Rationale:**

- Step 1 eliminates `PKG_INVALID_VERSION_NUMBER` — we never attempt to upload a version CWS already has.
- Step 1-BYPASS covers emergency force-republish of the same version (known-bad CRX, credential leak).
- Steps 2–3 make the upload fully verifiable before publish.
- Step 5 closes the silent-review-queue gap.
- Step 6 keeps the git tag as an honest record of "this version is live for users" — not a noisy record of "we tried to publish".

**Alternatives considered:**

- *Retain `--auto-publish` and add post-publish polling only*: rejected — doesn't fix duplicate-upload. The split IS what unlocks resumability.
- *Fail the workflow on step-5 timeout*: rejected — `IN_REVIEW` is a legitimate outcome; treating it as CI failure would block unrelated future releases.
- *Write the git tag on `IN_REVIEW`*: rejected — tag semantics say "shipped to users"; review queue hasn't shipped yet.

**Layer impact:** Infrastructure (workflow rewrite).

### Decision 5: Single runbook at `docs/runbooks/cws-service-account.md`

**Choice:** One markdown file covers:

- **One-time setup**: Google Cloud project / service-account creation, JSON key download, CWS Developer Dashboard linkage, `CWS_SERVICE_ACCOUNT_KEY` secret upload, decommissioning of the three OAuth secrets.
- **Key rotation** (when): service-account keys don't expire automatically; rotate if compromised or on a policy cadence the maintainer chooses (annual, quarterly — not prescribed). Procedure: generate a new key, update secret, revoke the old key.
- **Emergency re-publish**: use `workflow_dispatch` with `force_upload: true` when the published CRX is known-bad.
- **Revoking a compromised key**: what to do if the JSON key leaked (rotate immediately, audit CWS item submissions via the CWS Developer Dashboard, rotate extension-owned secrets if those were accessible).

Tracked via the `cws-auth-broken` issue template — the pre-flight's auto-created issue links here.

**Rationale:**

- One procedure, one markdown, searchable via repo grep.
- Service-account rotation is rare (yearly-to-never for unexposed keys); a dedicated workflow / runbook for each action would be overengineering.
- Combining "setup" and "rotate" in one file means a maintainer who last set it up 18 months ago can re-orient quickly.

**Alternatives considered:**

- *Separate runbooks per procedure*: rejected — separate files fragment context; procedures share 80% of their steps.
- *Document in CLAUDE.md / AGENTS.md*: rejected — those are AI-agent instructions, not ops runbooks.

**Layer impact:** Documentation.

### Decision 6: Preserve the existing workflow posture (matrix, shared credentials, `fail-fast: false`)

**Choice:** Keep the 2-extension matrix. Both extensions use the same service-account credentials (constrained by Google's "one service account per CWS publisher" rule — see Decision 1). Keep `fail-fast: false`. Keep `concurrency: ${{ github.workflow }}-${{ github.ref }}`.

**Rationale:**

- Capability contract (existing `cws-auto-publish` spec) stays stable on the parts that work.
- Minimizes blast radius of this change.

**Layer impact:** None (explicitly not changing).

## Risks / Trade-offs

- **[Risk] One-time manual setup is a blocker for any automation gain** → Acceptable. ≤15 minutes of Google Cloud Console + CWS Developer Dashboard work. The runbook guides it step-by-step. Without this one-time setup, the auth migration cannot proceed; but once done, the system is durable for years.
- **[Risk] Google's "one service account per publisher" limit** → Fits our use case (single publisher owning 2 extensions). Would constrain a future multi-publisher split, but that's a much larger re-org.
- **[Risk] Service-account JSON key in GitHub Secrets is exposed to any workflow that can access it** → Mitigation: the key is repo-scoped (not org-wide); only `cws-publish.yml` references it (enforced by code review + secret-scanning); GitHub masks it in logs automatically; the helper's tests include a "no secret in stdout/stderr" assertion (Factor XI defense-in-depth); if compromised, the runbook's "revoke compromised key" procedure is the response.
- **[Risk] The helper's JWT signing has a subtle clock-skew edge case** → Mitigation: the JWT `iat` and `exp` claims use `Date.now()` with a 60-second safety window on `iat` (backdating slightly to survive GitHub Actions runner clock drift vs Google's auth endpoint). Tested explicitly.
- **[Risk] CWS API semantics for `uploadState` / `reviewState` are under-documented** → Mitigation: the helper normalizes the known states (`UPLOADED`, `PUBLISHED`, `IN_REVIEW`) and any other response is treated as "state unclear → open an issue with the raw payload for manual triage". This also catches future CWS API additions gracefully.
- **[Risk] Adding pre-flight + post-publish polling adds ~30 s to each successful run** → Acceptable; CI minutes on publish are cheap (few runs/week).
- **[Risk] Removing `chrome-webstore-upload-cli` means we own the upload multipart-request implementation** → Mitigation: the CWS upload endpoint is a documented PUT with a zip body and `Content-Type: application/octet-stream` (NOT multipart); simpler than expected. The helper implementation is ~15 LOC for upload, covered by tests with mocked fetch.
- **[Trade-off] Factor X: no staging Chrome Web Store tier exists** → Chrome Web Store has no staging; every end-to-end test touches prod. Mitigations: (a) exhaustive fetch-mocked unit tests on the helper; (b) end-to-end verification scheduled with a real intended release, not speculatively; (c) pre-flight `check` is non-destructive and runs on any `workflow_dispatch` — so we can validate auth and connectivity without uploading.
- **[Trade-off] No fallback OAuth path** → Explicit. If the service-account path breaks mid-release due to a Google outage, rollback is `git revert` + restore the three OAuth secrets. The old path still works against the same CWS API.
- **[Trade-off] Emergency force-republish requires `workflow_dispatch`, not auto** → Intentional: `force_upload` bypasses a correctness guardrail; requiring a human to flip it ensures re-uploads of the same version are deliberate.
