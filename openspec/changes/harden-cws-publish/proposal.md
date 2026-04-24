## Why

The `CWS Publish` GitHub Actions workflow has failed **7 of 12 runs in the last 12 days** (Apr 12–24, 2026). Two distinct failure modes are responsible, and the current design can't detect or recover from either without manual intervention at the moment of release:

1. **OAuth token expiry** (`invalid_grant: Token has been expired or revoked`) — surfaces on the first publish attempt after Google revokes the refresh token (~6 month inactivity window). The workflow only learns about it during the actual upload, adding a minute of wasted CI and delaying the fix until someone reads the failure notification.
2. **Double upload** (`PKG_INVALID_VERSION_NUMBER`) — the workflow's upload step succeeded but auto-publish failed on a previous run, leaving Chrome Web Store in an `UPLOADED, not yet published` state. On the next retry, the upload fires again and CWS rejects the duplicate version, even though the local git tag doesn't exist yet.

Every failure either blocks a user-facing extension update or silently delays it. The workflow currently trusts git-tag state as its source of truth; the real source of truth for "is this version already in the Chrome Web Store?" is the CWS API itself.

## What Changes

- **Pre-flight token check**: before any upload, call the CWS API (`GET /items/<id>?projection=DRAFT`) to validate the refresh token. Fail fast (~5 s) with a clear error and auto-open a `cws-token-refresh-needed` issue instead of burning a minute on an upload that will fail.
- **Split upload from publish**: replace the single `--auto-publish` invocation with a two-step flow (`upload` → `publish`). Between them, query the CWS API to confirm the upload reached `UPLOADED` state. A failed publish leaves a well-defined state that the next run can resume from without duplicate-upload errors.
- **CWS API as source of truth for idempotency**: the "skip if already published" check SHALL consult the CWS API's `uploadState` / `draft.version` rather than the local git tag. If CWS already has the current `package.json` version in any state (`UPLOADED`, `PUBLISHED`, `IN_REVIEW`), the workflow SHALL skip upload and proceed to publish / verify only.
- **Post-publish verification**: after `publish`, poll the CWS API for up to 2 minutes to confirm the new version reaches `PUBLISHED` (or is accepted into a review queue). If the state transition doesn't happen, auto-open an issue with the last-seen CWS status so the maintainer can follow up without digging through logs.
- **Weekly token-age monitor**: a new `cws-token-health` scheduled workflow (cron Monday 09:00 UTC) runs a dry CWS API call. On 401/403, opens / bumps a single issue labelled `cws-token-refresh-needed` — the same label the reactive fail-fast uses, so both paths converge on one queue.
- **Token-rotation runbook**: new `docs/runbooks/cws-token-rotation.md` documenting the exact Google Cloud steps, `chrome-webstore-upload-cli init` command, and GitHub Secrets update path. Referenced from the auto-opened issue template so the fix takes minutes, not a Stack Overflow crawl.

## Capabilities

### New Capabilities

None. This change hardens existing behavior; no new capability surfaces outside the CI system.

### Modified Capabilities

- `cws-auto-publish`: extend with requirements for pre-flight token validation, upload/publish separation, API-as-source-of-truth idempotency, post-publish verification, weekly token-health monitoring, and a documented rotation runbook. The existing "Automated CWS publishing workflow" requirement SHALL remain authoritative on trigger conditions, matrix strategy, and shared credentials; the new requirements layer resilience on top.

## Impact

- **Package**: none (CI / ops only).
- **Layer**: `.github/workflows/*`, `docs/runbooks/*`, optionally `scripts/cws-api.mjs` helper.
- **Files**:
  - `.github/workflows/cws-publish.yml` — rewrite to add pre-flight check, split upload/publish, post-publish verification.
  - `.github/workflows/cws-token-health.yml` — new weekly scheduled workflow.
  - `.github/ISSUE_TEMPLATE/cws-token-refresh.md` — new issue template referenced from both the reactive and proactive detections.
  - `docs/runbooks/cws-token-rotation.md` — new documented procedure.
  - `scripts/cws-api.mjs` (or equivalent) — small helper for CWS API calls used by both workflows (pre-flight, state check, post-publish poll). Keeps the yaml readable and lets the logic be tested with `node --test`.
- **No runtime impact**, no npm package changes, no changesets required.
- **Rollback**: revert the workflow edits. The helper script and runbook are additive files; they don't break the pre-existing flow if the workflow reverts.
- **Secrets**: reuses existing `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_EXTENSION_ID`, `CWS_TRAIN2GO_EXTENSION_ID`. No new secrets required.
- **Preserves `workflow_dispatch`** for emergency manual re-publishes.
