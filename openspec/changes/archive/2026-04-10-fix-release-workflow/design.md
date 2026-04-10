## Context

The Release workflow (`release.yml`) runs on push to `main` when changeset or package files change. It currently:

1. Detects pending changesets
2. Runs `changeset version` to bump versions
3. Commits and pushes directly to `main`
4. Publishes to npm via OIDC provenance
5. Creates GitHub releases

Step 3 fails because branch protection requires PRs with 7 status checks. The workflow has never successfully published since branch protection was enabled.

Separately, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, and `@kaiord/garmin` are missing from `scripts/create-github-releases.js`.

## Goals / Non-Goals

**Goals:**

- Unblock the release pipeline so npm publish and GitHub releases work
- Use the community-standard `changesets/action` approach
- Maintain OIDC-based npm provenance (no token secrets)
- Create GitHub releases for all publishable packages dynamically
- Preserve `workflow_dispatch` for manual recovery

**Non-Goals:**

- Auto-merge of Version Packages PR (manual merge = release gate)
- Changes to changeset config or package versioning strategy
- Changes to the CI workflow (`ci.yml`) or changeset-bot workflow
- Changes to the contribution flow documentation (existing `CLAUDE.md` already documents changesets; the Version Packages PR is a maintainer concern, not a contributor one)

## Decisions

### D1: Use `changesets/action@v1` with `publish` input

**Layer**: Infrastructure (CI/CD)

**Choice**: Replace the manual `changeset version` + `git commit` + `git push` with `changesets/action@v1`. Pass the publish command as the `publish` input to the action:

```yaml
- uses: changesets/action@v1
  with:
    version: pnpm exec changeset version && pnpm install --no-frozen-lockfile
    publish: pnpm -r build && pnpm exec changeset publish
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_CONFIG_PROVENANCE: true
```

The `version` input is a custom script that runs `changeset version` followed by `pnpm install --no-frozen-lockfile` to update `pnpm-lock.yaml`. Without this, the Version Packages PR would have a stale lockfile since `changeset version` modifies `package.json` files but does not run `pnpm install`.

**Rationale**: The `publish` input includes `pnpm -r build` before `changeset publish` because most packages lack `prepublishOnly`/`prepack` lifecycle scripts (only `@kaiord/cli` has one). Without building first, published packages would ship without compiled `dist/` output.

The `publish` input is required for two additional reasons:

1. The action only populates the `publishedPackages` output when `publish` is provided
2. It handles both modes automatically:
   - **Changesets present**: Creates/updates a "Version Packages" PR (ignores `publish`)
   - **No changesets** (version PR just merged): Runs the publish command and outputs `publishedPackages`

**Alternatives considered**:

- _Bypass branch protection for bot_: Weakens security, requires PAT or GitHub App, contradicts "always use PRs" policy
- _Use a GitHub App token_: More complex setup, still pushes directly to main
- _Run publish as separate step_: Would not populate `publishedPackages` output from the action

### D2: Remove infinite-loop guard, rely on action's internal logic

**Layer**: Infrastructure (CI/CD)

**Choice**: Remove the `if: "!contains(github.event.head_commit.message, 'chore: version packages')"` guard on the job.

**Rationale**: The current guard is fragile — it depends on exact commit message text which varies by merge strategy (squash, merge commit, rebase). With `changesets/action`, the loop is naturally broken:

- When the Version Packages PR is merged, `.changeset/` files have been consumed (deleted by `changeset version`), so `hasChangesets` is `false`
- The action runs publish and exits — no new commit is pushed to `main`, no re-trigger
- The `paths` filter ensures the workflow triggers on the Version Packages PR merge (it changes `packages/*/package.json` and `packages/*/CHANGELOG.md`), but it is NOT a loop-prevention mechanism — loop prevention is solely via changeset file consumption
- Note: `workflow_dispatch` bypasses `paths` filters entirely (GitHub Actions behavior), so manual recovery always works regardless of which files changed
- The existing `concurrency` guard prevents parallel runs

### D3: Update workflow permissions to minimal set

**Layer**: Infrastructure (CI/CD)

**Choice**: Set permissions to: `contents: write`, `pull-requests: write`, `issues: read`, `id-token: write`.

**Rationale**:

- `contents: write`: Required for pushing tags and creating releases
- `pull-requests: write`: Required by `changesets/action` to create/update the "Version Packages" PR. Without it, the action fails with a 403 error
- `issues: read`: Downgraded from `write` — `changesets/action` only reads issues for changelog generation, nothing in the workflow writes issues
- `id-token: write`: Required for OIDC-based npm provenance

### D4: Dynamic package list via `PUBLISHED_PACKAGES` env var

**Layer**: Infrastructure (CI/CD)

**Choice**: Pass the action's `publishedPackages` JSON output to `create-github-releases.js` as the `PUBLISHED_PACKAGES` environment variable. The script will:

1. If `PUBLISHED_PACKAGES` is set: parse the JSON array of `{ name, version }` objects and create releases for those packages
2. If `PUBLISHED_PACKAGES` is not set (e.g., `workflow_dispatch`): fall back to a hardcoded list of all 9 publishable packages, reading each `packages/<name>/package.json` for the current version

Contract:

```yaml
# In workflow YAML:
- name: Create GitHub Releases
  run: node scripts/create-github-releases.js
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    PUBLISHED_PACKAGES: ${{ steps.changesets.outputs.publishedPackages }}
```

```javascript
// In create-github-releases.js:
const publishedPackages = process.env.PUBLISHED_PACKAGES
  ? JSON.parse(process.env.PUBLISHED_PACKAGES) // [{ name, version }]
  : getPackagesFromDisk(); // hardcoded list fallback for workflow_dispatch

// Fallback: read version from each package.json
function getPackagesFromDisk() {
  const dirs = [
    "core",
    "fit",
    "tcx",
    "zwo",
    "garmin",
    "garmin-connect",
    "cli",
    "mcp",
    "ai",
  ];
  return dirs
    .filter((d) => fs.existsSync(`packages/${d}/package.json`))
    .map((d) => {
      const pkg = JSON.parse(
        fs.readFileSync(`packages/${d}/package.json`, "utf8")
      );
      return { name: pkg.name, version: pkg.version };
    });
}
```

**Rationale**: This eliminates the need to maintain a hardcoded list for the normal release flow while preserving manual recovery capability. The fallback list must include all 9 publishable packages.

### D5: Workflow structure — single job, action-driven conditionals

**Layer**: Infrastructure (CI/CD)

**Choice**: Keep the single-job structure. Post-action steps (GitHub releases, summary) run conditionally on `steps.changesets.outputs.published == 'true'`.

**Rationale**: Simpler than multi-job. The action's outputs (`hasChangesets`, `published`, `publishedPackages`) provide clean conditionals.

## Risks / Trade-offs

- **[Risk] OIDC provenance inside changesets/action** → The action spawns `changeset publish` as a child process that inherits env vars including `NPM_CONFIG_PROVENANCE=true`. The OIDC token is requested via GitHub's endpoint (`token.actions.githubusercontent.com`) at publish time. This is a well-tested pattern used by major projects (Turborepo, Preconstruct, etc.). Ref: `changesets/action` supports provenance natively.
  → **Mitigation**: Verify first release shows provenance badge on npmjs.com.

- **[Risk] First run creates Version Packages PR with existing changesets** → Expected behavior. Review the PR contents before merging to confirm correct version bumps.
  → **Mitigation**: Manually review the first Version Packages PR.

- **[Risk] `workflow_dispatch` without `PUBLISHED_PACKAGES`** → The script falls back to scanning package.json files. This path must include all 9 publishable packages.
  → **Mitigation**: The fallback list is part of the implementation and covered by task 2.1.

- **[Trade-off] Extra merge step** → Releasing requires merging the Version Packages PR. This is intentional — it's a release gate that aligns with the project's PR-based workflow.

- **[Risk] Tag creation flow** → `changeset publish` creates git tags (e.g., `@kaiord/core@1.2.0`) and pushes them (`git push --follow-tags`). `create-github-releases.js` then creates GitHub releases against those existing tags. This is the expected interaction — the script checks if a release already exists before creating one, so duplicate runs are safe.

- **[Risk] Partial publish failure** → If `changeset publish` publishes some packages but fails mid-way (npm outage, network issue), `publishedPackages` will only contain the successful ones. Recovery: re-run via `workflow_dispatch`. `changeset publish` is idempotent — it skips already-published versions and publishes the remaining ones.

- **[Risk] `changesets/action@v1` is a mutable major-version tag** → Like `actions/checkout@v6` (already used in this repo), `@v1` points to the latest minor/patch. This is consistent with the project's existing convention. If supply-chain hardening is desired later, pin to a specific commit SHA.

- **[Risk] Version Packages PR goes stale** → The PR auto-updates on each push to `main` with changesets. No manual maintenance needed.
