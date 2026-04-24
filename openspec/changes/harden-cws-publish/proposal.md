## Why

The `CWS Publish` GitHub Actions workflow has failed **7 of 12 runs in the last 12 days** (Apr 12–24, 2026). Two distinct failure modes surfaced:

1. **OAuth refresh-token expiry** (`invalid_grant: Token has been expired or revoked`). Google revokes user-delegated refresh tokens after ~6 months of inactivity; renewing requires an interactive browser OAuth flow, so the fix is never automatable.
2. **Duplicate upload** (`PKG_INVALID_VERSION_NUMBER`). A prior run's upload succeeded but auto-publish failed; the workflow's git-tag-based idempotency check didn't see the orphaned upload in CWS, retried, and CWS rejected the duplicate.

The root cause of (1) is structural: the current workflow uses OAuth 2.0 *user authentication*, which is inherently fragile for server-to-server use (tokens expire, Google revokes them, renewal requires a human at a browser). The Chrome Web Store API **also supports service-account authentication** (documented at https://developer.chrome.com/docs/webstore/service-accounts) — the same model fastlane-supply uses for the Google Play Store. A service account JSON key does not expire and can be rotated on the maintainer's own cadence. Every commercial Android pipeline is built on this; there is no good reason kaiord's CWS publish stays on user-OAuth.

The root cause of (2) is equally structural: the workflow asks "did I tag this version in git?" when the authoritative fact is "what version has CWS accepted?". Using git tags as a proxy for CWS state loses information across partial failures.

This change closes both gaps structurally. It does **not** just add monitoring or runbooks on top of a fragile foundation.

## What Changes

- **Migrate authentication from OAuth refresh token to Google Cloud service account.** New secret `CWS_SERVICE_ACCOUNT_KEY` (the service-account JSON content). Deprecated secrets: `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`. The maintainer performs a one-time setup (create service account in Google Cloud, link it in the Chrome Web Store Developer Dashboard, upload the JSON key as a repo secret) documented in the new runbook.
- **Replace `chrome-webstore-upload-cli` with direct Chrome Web Store REST API calls** implemented in a new `scripts/cws-api.mjs` helper. The CLI does not support service-account auth; rather than fork upstream, absorb its functionality (~80 lines: JWT signing, access-token mint, multipart upload, publish, state query) into the repo. Drops a devDep.
- **Split upload from publish.** Helper exposes `upload`, `publish`, `state` as distinct subcommands. The workflow calls them as separate steps with a CWS-API state check between. A partial failure (upload succeeded, publish didn't) is resumable on the next run without duplicate-upload errors.
- **CWS API state as source of truth for idempotency.** The "skip upload?" decision queries the CWS API's `draft.version` / `draft.uploadState` / `published.version`, never the git tag. The git tag is written at the end of a successful verified publish, as a record — not as an input to the next run.
- **Post-publish verification.** Poll CWS for up to 2 minutes to confirm the new version reaches `PUBLISHED` (or is accepted into `IN_REVIEW` — manual-review is a legitimate terminal state that the workflow reports via a tracking issue but does NOT fail on).
- **Pre-flight auth check.** Fail-fast (≤5 s) if the service-account credentials are invalid or the account has lost access to the extension. Opens an auto-tracking issue labelled `cws-auth-broken` with a link to the runbook.
- **`force_upload` escape hatch.** New `workflow_dispatch` input to bypass the CWS-state idempotency check when the published CRX is known-bad (build regression, credential leak, post-publish malware-scan rejection). Default `false`; documented in the runbook.
- **Single-file runbook at `docs/runbooks/cws-service-account.md`** covering (a) one-time Google Cloud + CWS Developer Dashboard setup; (b) key rotation (security best practice, not forced by Google); (c) emergency re-publish with `force_upload: true`; (d) revoking a compromised key.

## Capabilities

### New Capabilities

None. All work hardens an existing capability.

### Modified Capabilities

- `cws-auto-publish`: (a) replaces OAuth user-flow auth with service-account JWT auth as the authoritative mechanism; (b) mandates upload/publish separation with CWS-API state as the idempotency source of truth; (c) adds post-publish verification; (d) adds pre-flight auth validation; (e) adds a `force_upload` emergency override; (f) mandates the setup/rotation runbook. The existing trigger conditions (push to `main` on extension paths + `workflow_dispatch`), matrix strategy (two extensions sharing credentials), and `fail-fast: false` posture are preserved.

## Impact

- **Package**: none (CI / ops only).
- **Layer**: `.github/workflows/*`, `docs/runbooks/*`, `scripts/cws-api.mjs`.
- **Files**:
  - `.github/workflows/cws-publish.yml` — rewrite: service-account auth, pre-flight, state query, upload (via helper), publish (via helper), post-publish verify, git-tag on success, `force_upload` input.
  - `docs/runbooks/cws-service-account.md` — new.
  - `scripts/cws-api.mjs` + `scripts/cws-api.test.mjs` — new helper and tests (subsumes CLI functionality).
  - `scripts/cws-notify-issue.mjs` + test — small helper for open-or-bump GitHub issues (used by pre-flight + post-publish verify).
  - `.github/ISSUE_TEMPLATE/cws-auth-broken.md` — new.
  - `package.json` — remove `chrome-webstore-upload-cli` devDep.
- **Secrets (repo settings)**:
  - NEW: `CWS_SERVICE_ACCOUNT_KEY` — JSON content of the service-account key.
  - KEEP: `CWS_EXTENSION_ID`, `CWS_TRAIN2GO_EXTENSION_ID` — extension identifiers, unchanged.
  - REMOVE (after migration): `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` — no longer used.
- **No runtime impact**, no npm package changes, no changesets required.
- **One-time maintainer action** (not automatable): follow the runbook to create the service account in Google Cloud and link it in the Chrome Web Store Developer Dashboard. ~15 minutes. After this, future releases and the next ~every-5-years key rotation are the only touchpoints.
- **Rollback**: the workflow edits are revertable. The helper and runbook are additive files. If the migration needs to be aborted mid-flight, the prior OAuth secrets can be temporarily re-enabled by reverting the workflow — both auth methods work against the same CWS API.
- **Preserves `workflow_dispatch`** and the matrix strategy.
