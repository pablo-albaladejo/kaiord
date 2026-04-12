## Context

The Garmin Bridge extension is published manually to the Chrome Web Store via dashboard upload. The existing monorepo uses changesets for npm package versioning and a `release.yml` workflow for automated npm publishing. The extension is `private: true` (not npm-published) and currently in the changesets `ignore` list.

## Goals / Non-Goals

**Goals:**

- Automate CWS upload and publish when `@kaiord/garmin-bridge` version changes
- Keep manifest versions in sync with `package.json` automatically
- Integrate with the existing changesets versioning flow
- Make the process reproducible and auditable via CI logs

**Non-Goals:**

- Firefox AMO publishing (separate concern, blocked by `externally_connectable`)
- Automated screenshot generation (static assets, change rarely)
- CWS listing metadata updates via API (description, icons — done manually when needed)

## Decisions

### D1: Trigger — dedicated workflow detecting version changes

**Key constraint:** `@kaiord/garmin-bridge` is `private: true`. The `changesets/action` does NOT include private packages in its `publishedPackages` output, even when they are versioned. This means we cannot piggyback on the release workflow's publish step.

**Approach:** Create a separate `cws-publish.yml` workflow triggered on push to main when `packages/garmin-bridge/**` changes. The workflow detects version changes by comparing the `package.json` version against the latest git tag (`garmin-bridge@*`). If the version is newer, it packages and publishes.

**Pre-requisite:** Remove `@kaiord/garmin-bridge` from `.changeset/config.json` `ignore` list. This allows changesets to version the package (bump package.json) when changesets are consumed. Since the package is `private: true`, `changeset publish` automatically skips npm publish and does NOT create git tags for it — no risk of accidental npm release.

**Concurrent execution:** Both `release.yml` and `cws-publish.yml` fire on the same push when the Version Packages PR merges. This is safe — they operate on independent resources (npm vs CWS) and do not share tags (changesets skips tags for private packages, `cws-publish.yml` creates its own `@kaiord/garmin-bridge@{version}` tags).

**Why not use release.yml?** The `changesets/action` `publishedPackages` output does not include private packages, so the conditional check would never fire. A separate workflow with git-based version detection is more reliable for private packages.

**Layer:** Infrastructure (CI/CD).

### D2: CWS upload — `chrome-webstore-upload-cli`

Use `chrome-webstore-upload-cli` to upload and publish via the CWS API. It requires three OAuth2 credentials: `client_id`, `client_secret`, `refresh_token`. Run with `--auto-publish` flag.

**Alternatives considered:**

- **Manual `curl` calls**: More fragile, harder to maintain
- **`web-ext`**: Mozilla's tool, CWS support is limited
- **Custom script**: Unnecessary when a maintained CLI exists

**Layer:** Infrastructure (build tooling).

### D3: Version sync — pre-package script

Add a `scripts/sync-extension-version.mjs` script that reads the version from `packages/garmin-bridge/package.json` and updates the `version` field in both `manifest.json` and `manifest.prod.json`. The script is idempotent — if versions already match, it exits successfully without modifying files.

**Integration with changesets:** The sync script is called from `scripts/changeset-version.sh` after `changeset version` runs. This ensures manifest bumps are committed alongside `package.json` bumps in the Version Packages PR, keeping the repository always consistent. The `cws-publish.yml` workflow also runs it as a safety net before packaging.

**Layer:** Infrastructure (build tooling).

### D4: Credentials — GitHub Secrets

Store CWS API credentials and the extension ID as GitHub Secrets:

- `CWS_CLIENT_ID` — Google Cloud OAuth client ID
- `CWS_CLIENT_SECRET` — Google Cloud OAuth client secret
- `CWS_REFRESH_TOKEN` — Long-lived refresh token (scope: `https://www.googleapis.com/auth/chromewebstore`)
- `CWS_EXTENSION_ID` — Chrome Web Store extension ID (from the CWS dashboard URL; not sensitive but stored as secret for consistency)

A `docs/cws-credentials-setup.md` guide documents the one-time setup process, including setting the OAuth consent screen to "production" status (prevents token expiry), minimum required OAuth scope, and periodic token rotation guidance.

**Layer:** Infrastructure (secrets management).

### D5: Failure handling

If the CWS upload fails, the workflow run shows as failed (red). Since this is a separate workflow from `release.yml`, npm publishes and GitHub releases are unaffected. Re-running the CWS workflow is safe — it re-packages and re-uploads the same version.

The workflow step runs without verbose flags to minimize risk of credential fragments in logs. GitHub Actions automatically masks exact secret matches in output.

**Layer:** Infrastructure (CI/CD).

## Risks / Trade-offs

- **[Token expiry]** The refresh token can expire if the Google Cloud app is not set to "production" status. → Mitigation: Document setting the OAuth consent screen to production in the setup guide. Include periodic rotation guidance.
- **[CWS review delay]** Auto-publish uploads immediately, but CWS may hold the update for review. → Mitigation: This is expected behavior; the workflow reports success on upload completion. CWS review is asynchronous and not controllable.
- **[Version drift]** If someone edits manifest versions manually, they diverge from package.json. → Mitigation: The version sync script in CI ensures it never ships wrong. The packaging script has an existing mismatch check as a safety net.
- **[Partial failure]** If npm releases succeed but CWS fails (or vice versa), the release is partially complete. → Mitigation: Separate workflows mean failures are isolated. Re-running the CWS workflow is safe and does not affect npm.
- **[Broken CWS publish]** If a broken version is published to CWS, it cannot be unpublished. → Mitigation: Create a new changeset bumping garmin-bridge, merge to main, and the workflow will publish the fix. CWS updates replace the previous version.
