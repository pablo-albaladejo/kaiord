## ADDED Requirements

### Requirement: Release workflow uses PR-based versioning

The release workflow SHALL use `changesets/action@v1` to create a "Version Packages" PR instead of pushing version bumps directly to `main`. The `publish` command SHALL be passed as an input to the action so that `publishedPackages` output is populated.

#### Scenario: Changesets present on main

- **WHEN** a push to `main` includes pending changeset files
- **THEN** the workflow SHALL create or update a PR titled "Version Packages" with bumped versions and updated changelogs

#### Scenario: Version Packages PR merged

- **WHEN** the "Version Packages" PR is merged to `main` (no remaining changesets)
- **THEN** the workflow SHALL run `changeset publish` via the action's `publish` input, publishing updated packages to npm with OIDC provenance

#### Scenario: Manual workflow dispatch

- **WHEN** the workflow is triggered via `workflow_dispatch`
- **THEN** the workflow SHALL behave identically to a push trigger (create PR if changesets exist, publish if none)

### Requirement: Workflow permissions are minimal and sufficient

The workflow SHALL declare exactly the permissions needed: `contents: write`, `pull-requests: write`, `issues: read`, and `id-token: write`.

#### Scenario: Action creates Version Packages PR

- **WHEN** `changesets/action` attempts to create or update the "Version Packages" PR
- **THEN** the action SHALL succeed because `pull-requests: write` permission is granted

#### Scenario: OIDC provenance during publish

- **WHEN** `changeset publish` runs with `NPM_CONFIG_PROVENANCE=true`
- **THEN** npm SHALL request an OIDC token via `id-token: write` and publish with provenance attestation

### Requirement: No infinite loop on version commits

The workflow SHALL NOT use commit-message-based guards to prevent re-triggering. Instead, the natural absence of changeset files after `changeset version` SHALL prevent infinite loops.

#### Scenario: Version Packages PR merge does not re-trigger versioning

- **WHEN** the Version Packages PR is merged (all changeset files consumed)
- **THEN** `changesets/action` SHALL detect no pending changesets, skip PR creation, and proceed to publish

### Requirement: GitHub releases created for all publishable packages

The `create-github-releases.js` script SHALL create GitHub releases for all published packages. When `PUBLISHED_PACKAGES` env var is set (JSON array of `{ name, version }`), the script SHALL use it. When not set, the script SHALL fall back to scanning package.json files for all 9 publishable packages: `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/cli`, `@kaiord/mcp`, `@kaiord/ai`.

#### Scenario: Dynamic package list from action output

- **WHEN** `PUBLISHED_PACKAGES` env var contains `[{"name":"@kaiord/core","version":"1.2.0"}]`
- **THEN** the script SHALL create a GitHub release for `@kaiord/core@1.2.0`

#### Scenario: Fallback for workflow_dispatch

- **WHEN** `PUBLISHED_PACKAGES` env var is not set
- **THEN** the script SHALL scan package.json files for all 9 publishable packages and create releases for any with new versions

#### Scenario: Garmin package released

- **WHEN** `@kaiord/garmin` has a version bump and is in `publishedPackages`
- **THEN** a GitHub release SHALL be created for `@kaiord/garmin`

#### Scenario: FIT package released

- **WHEN** `@kaiord/fit` has a version bump and is in `publishedPackages`
- **THEN** a GitHub release SHALL be created for `@kaiord/fit`

#### Scenario: Partial publish failure recovery

- **WHEN** a previous run published only a subset of packages (partial failure) and the workflow is re-triggered via `workflow_dispatch`
- **THEN** `changeset publish` SHALL skip already-published versions and publish the remaining ones, and GitHub releases SHALL be created for all successfully published packages

### Requirement: Release summary in workflow output

The workflow SHALL produce a step summary listing all published packages with versions and npm links.

#### Scenario: Multiple packages published

- **WHEN** `publishedPackages` contains multiple entries
- **THEN** the summary SHALL list each package with its version and a link to npmjs.com

#### Scenario: No packages published

- **WHEN** no packages are published (`published != 'true'`)
- **THEN** the summary SHALL indicate no release was performed
