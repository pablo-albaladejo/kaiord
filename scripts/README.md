# Scripts

This directory contains utility scripts for the Kaiord project.

## Archive invariants (gated by CI)

Every non-trivial script here ships with a co-located `*.test.mjs`
exercised by `pnpm test:scripts` (CI-enforced in the `lint` job and
in the husky `pre-commit` hook).

| Script                       | Purpose                                                                                                                                                                                                                                                 | Invoked by                                | Test file                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| `check-archive-dates.mjs`    | Fail if any `openspec/changes/archive/YYYY-MM-DD-<slug>/` folder prefix disagrees with the `> Completed:` marker in its `proposal.md`. Also rejects invalid calendar dates (e.g. `2026-02-31`).                                                         | `pnpm lint:archive` (→ `pnpm lint`)       | `check-archive-dates.test.mjs` (5 cases)    |
| `check-archive-index.mjs`    | Drift guard: regenerate `openspec/changes/archive/README.md` in memory and fail on any diff (including a missing README.md), so a contributor who forgets `pnpm archive:index` cannot merge a stale index. Prints the first differing lines on failure. | `pnpm lint:archive-index` (→ `pnpm lint`) | `check-archive-index.test.mjs` (3 cases)    |
| `generate-archive-index.mjs` | Render the auto-generated archive README as a reverse-chronological table with per-change summaries extracted from `proposal.md`. Exports `buildIndex()` so the drift guard reuses the same generator — no parallel reimplementation.                   | `pnpm archive:index`                      | `generate-archive-index.test.mjs` (6 cases) |

## Authoring guide for new scripts

1. Every new script in `scripts/` SHOULD have a co-located
   `*.test.mjs` using `node:test`. It will be picked up automatically
   by `pnpm test:scripts` via the `scripts/*.test.mjs` glob.
2. Entry-point guard: use
   `if (import.meta.url === pathToFileURL(process.argv[1]).href)`
   from `node:url` — string concatenation is Windows-hostile.
3. Path resolution: resolve repo paths via `import.meta.url` +
   `fileURLToPath` so the script works from any cwd. Never rely on
   `process.cwd()`.
4. Side-effect-free exports: expose the core logic as a pure function
   (e.g. `checkArchives()`, `buildIndex()`) so tests can exercise it
   without spawning a subprocess when possible.
5. CI enforcement: any script gating `pnpm lint` MUST be documented
   in the table above, referenced in `CLAUDE.md` Commands, and
   covered by `pnpm test:scripts`.

## test-ci-workflows.sh

Simulates GitHub Actions CI workflows locally to catch deployment issues before pushing to GitHub.

### Purpose

This script validates the complete deployment process by:

1. **Core Build Test** - Ensures `@kaiord/core` builds successfully in a clean environment
2. **SPA Build Test** - Verifies the SPA builds with the core dependency
3. **Dependency Order Test** - Confirms the SPA fails without core and succeeds with it
4. **Deployment Simulation** - Validates GitHub Pages deployment requirements
5. **Build Reproducibility** - Ensures frozen lockfile is up to date

### Usage

```bash
# Make script executable (first time only)
chmod +x scripts/test-ci-workflows.sh

# Run all tests
./scripts/test-ci-workflows.sh
```

### When to Run

Run this script before:

- Pushing changes to `main` branch
- Creating a pull request that affects deployment
- Making changes to:
  - `packages/workout-spa-editor/**`
  - `packages/core/**`
  - `.github/workflows/deploy-spa-editor.yml`
  - `pnpm-lock.yaml`

### What It Tests

#### Test 1: Core Build Test

Simulates a clean CI environment:

```bash
# Removes build artifacts
rm -rf packages/core/dist

# Installs dependencies
pnpm install --frozen-lockfile

# Builds core package
pnpm --filter @kaiord/core build

# Verifies artifacts exist
- packages/core/dist/
- packages/core/dist/index.d.ts
- packages/core/dist/index.js
```

#### Test 2: SPA Build Test

Builds the SPA with core dependency:

```bash
# Removes SPA build artifacts
rm -rf packages/workout-spa-editor/dist

# Builds SPA with base path
VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build

# Verifies artifacts exist
- packages/workout-spa-editor/dist/
- packages/workout-spa-editor/dist/index.html
- packages/workout-spa-editor/dist/assets/
```

#### Test 3: Dependency Order Test

Validates build dependency order:

```bash
# Removes core dist
rm -rf packages/core/dist

# Attempts to build SPA (should fail)
pnpm --filter @kaiord/workout-spa-editor build  # ❌ Expected to fail

# Rebuilds core
pnpm --filter @kaiord/core build

# Builds SPA (should succeed)
pnpm --filter @kaiord/workout-spa-editor build  # ✅ Expected to succeed
```

#### Test 4: Deployment Simulation

Validates GitHub Pages requirements:

```bash
# Checks base path in index.html
grep 'src="/kaiord/' packages/workout-spa-editor/dist/index.html

# Verifies no hardcoded absolute URLs
! grep 'src="http' packages/workout-spa-editor/dist/index.html

# Validates artifact structure
- index.html at root
- assets/ directory exists
- JavaScript bundles present
- CSS bundles present
- Sourcemaps generated
```

#### Test 5: Build Reproducibility

Ensures consistent builds:

```bash
# Validates frozen lockfile
pnpm install --frozen-lockfile

# Checks lockfile is up to date
git diff --exit-code pnpm-lock.yaml
```

### Expected Output

```
🧪 Testing CI Workflows Locally
================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: Core Build Test (Clean Environment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Simulating CI environment by removing build artifacts...
ℹ️  Installing dependencies with frozen lockfile...
✅ Dependencies installed successfully
ℹ️  Building core package...
✅ Core package built successfully
ℹ️  Verifying core dist artifacts exist...
✅ Core dist directory exists
ℹ️  Verifying TypeScript declaration files...
✅ TypeScript declaration files present
ℹ️  Verifying JavaScript output files...
✅ JavaScript output files present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 2: SPA Build Test (With Core Dependency)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Removing SPA build artifacts...
ℹ️  Building SPA with core dependency...
✅ SPA built successfully
ℹ️  Verifying SPA dist artifacts exist...
✅ SPA dist directory exists
ℹ️  Verifying index.html exists...
✅ index.html present
ℹ️  Verifying assets directory exists...
✅ Assets directory present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 3: Dependency Order Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Removing core dist to simulate missing dependency...
ℹ️  Attempting to build SPA without core (should fail)...
✅ SPA correctly fails without core dependency
ℹ️  Rebuilding core package...
✅ Core package rebuilt
ℹ️  Building SPA with core dependency...
✅ SPA builds successfully with core dependency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 4: Deployment Simulation (GitHub Pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Verifying base path configuration in index.html...
✅ Base path correctly configured in index.html
ℹ️  Verifying no hardcoded absolute paths...
✅ No hardcoded absolute paths found
ℹ️  Verifying artifact structure matches GitHub Pages requirements...
✅ index.html at root of dist
✅ assets directory present
ℹ️  Checking for JavaScript bundles in assets...
✅ JavaScript bundles present (3 files)
ℹ️  Checking for CSS bundles in assets...
✅ CSS bundles present (1 files)
ℹ️  Verifying sourcemaps are generated...
✅ Sourcemaps present (4 files)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 5: Build Reproducibility
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Testing frozen lockfile enforcement...
✅ Frozen lockfile validation passed
ℹ️  Verifying pnpm-lock.yaml is up to date...
✅ pnpm-lock.yaml is up to date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tests Passed: 20
❌ Tests Failed: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

================================
✅ All CI workflow tests passed!
================================

You can now safely push to GitHub.
The deployment workflow should succeed.
```

### Troubleshooting

#### Script Fails: "Permission denied"

Make the script executable:

```bash
chmod +x scripts/test-ci-workflows.sh
```

#### Test Fails: "Core build failed"

Check for TypeScript errors:

```bash
cd packages/core
pnpm build
```

Fix any compilation errors and run the script again.

#### Test Fails: "SPA build failed"

Ensure core is built first:

```bash
pnpm --filter @kaiord/core build
pnpm --filter @kaiord/workout-spa-editor build
```

#### Test Fails: "Frozen lockfile validation failed"

Update the lockfile:

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
```

#### Test Fails: "Base path not found"

Ensure `VITE_BASE_PATH` is set:

```bash
VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
```

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

### Integration with CI/CD

This script mirrors the GitHub Actions workflow (`.github/workflows/deploy-spa-editor.yml`):

| Script Test                   | Workflow Step                |
| ----------------------------- | ---------------------------- |
| Test 1: Core Build            | Build core package           |
| Test 2: SPA Build             | Build SPA Editor             |
| Test 3: Dependency Order      | (Implicit in workflow order) |
| Test 4: Deployment Simulation | Verify SPA build             |
| Test 5: Build Reproducibility | Install dependencies         |

### Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Complete deployment guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [.github/workflows/deploy-spa-editor.yml](../.github/workflows/deploy-spa-editor.yml) - Deployment workflow

## Other Scripts

### setup-npm-publishing.sh

Configures npm publishing with token-based authentication (legacy method).

**Recommended**: Use [Trusted Publishing](../.github/NPM_TRUSTED_PUBLISHING.md) instead.

### quick-setup-npm.sh

Quick setup script for npm publishing configuration for `@kaiord/core` package.

### quick-setup-npm-cli.sh

Quick setup script for npm publishing configuration for `@kaiord/cli` package using **token-based authentication** (legacy method).

**⚠️ Note:** Consider using `setup-trusted-publishing-cli.sh` instead for better security.

**Usage:**

```bash
# Make script executable (first time only)
chmod +x scripts/quick-setup-npm-cli.sh

# Run the setup
./scripts/quick-setup-npm-cli.sh
```

**What it does:**

1. Verifies npm authentication
2. Checks @kaiord scope access
3. Optionally creates/updates npm token
4. Configures GitHub secret (NPM_TOKEN)
5. Verifies package status on npm
6. Runs pre-publish checks (build, tests)
7. Provides next steps for publishing

**Next steps after running:**

```bash
# 1. Build the package
pnpm --filter @kaiord/cli build

# 2. Create changeset
pnpm exec changeset
# Select: @kaiord/cli
# Version: patch/minor/major

# 3. Commit and push
git add .changeset/ && git commit -m 'chore: release cli' && git push

# 4. Merge 'Version Packages' PR

# 5. Watch CI/CD
# https://github.com/pablo-albaladejo/kaiord/actions
```

**Manual publish (if needed):**

```bash
cd packages/cli && npm publish --access public
```

### setup-trusted-publishing-cli.sh

🔒 **Recommended:** Setup script for npm Trusted Publishing for `@kaiord/cli` package.

Trusted Publishing is more secure than tokens because:

- ✅ No secrets needed (uses OpenID Connect)
- ✅ Automatic verification by npm
- ✅ Cryptographic provenance attestation
- ✅ No token rotation required
- ✅ Eliminates token theft risk

**Usage:**

```bash
# Make script executable (first time only)
chmod +x scripts/setup-trusted-publishing-cli.sh

# Run the setup
./scripts/setup-trusted-publishing-cli.sh
```

**What it does:**

1. Verifies npm authentication
2. Checks if package is published (required for trusted publishing)
3. Optionally publishes package for the first time
4. Guides you through configuring trusted publishing on npm
5. Verifies workflow has correct permissions
6. Provides testing instructions
7. Suggests cleanup of old NPM_TOKEN (if exists)

**Configuration on npm:**

The script will guide you to configure on npm:

- Provider: **GitHub Actions**
- Repository owner: `pablo-albaladejo`
- Repository name: `kaiord`
- Workflow name: `release.yml` (or leave empty)
- Environment: (leave empty)

**Note:** `@kaiord` is an npm organization. Make sure you have admin access to configure trusted publishing.

**Testing trusted publishing:**

```bash
# 1. Create changeset
pnpm exec changeset
# Select: @kaiord/cli, Version: patch

# 2. Commit and push
git add .changeset/ && git commit -m 'chore: test trusted publishing' && git push

# 3. Merge 'Version Packages' PR

# 4. Verify provenance
npm view @kaiord/cli --json | jq '.dist.attestations'
```

**Documentation:**

See [NPM_TRUSTED_PUBLISHING.md](../.github/NPM_TRUSTED_PUBLISHING.md) for detailed information.

### test-workflow.sh

Tests individual GitHub Actions workflows locally using `act`.

See [TESTING_WORKFLOWS.md](../.github/TESTING_WORKFLOWS.md) for details.

## Release Tag Scripts

### parse-release-tag.sh

Parses package-scoped release tags to extract package name and version.

**Usage:**

```bash
./scripts/parse-release-tag.sh @kaiord/core@1.2.3
```

**Output:**

```
PACKAGE_NAME=@kaiord/core
VERSION=1.2.3
```

**Exit codes:**

- `0` - Success
- `1` - Invalid tag format

**Tests:** Run `./scripts/test-parse-release-tag.sh`

### validate-package.sh

Validates that a package exists and its version matches the release tag.

**Usage:**

```bash
./scripts/validate-package.sh @kaiord/core 1.2.3
```

**Exit codes:**

- `0` - Success
- `1` - Invalid arguments
- `2` - Package not found
- `3` - Version mismatch

**Tests:** Run `./scripts/test-validate-package.sh`

### extract-changelog.sh

Extracts version-specific changelog section from CHANGELOG.md files.

**Purpose:**

This script parses CHANGELOG.md files to extract the content for a specific version, which is then included in GitHub release notes. It handles various changelog formats and edge cases gracefully.

**Usage:**

```bash
./scripts/extract-changelog.sh <changelog-file> <version>
```

**Examples:**

```bash
# Extract changelog for @kaiord/core v1.2.3
./scripts/extract-changelog.sh packages/core/CHANGELOG.md 1.2.3

# Extract changelog for @kaiord/cli v0.5.0
./scripts/extract-changelog.sh packages/cli/CHANGELOG.md 0.5.0

# Extract pre-release version
./scripts/extract-changelog.sh packages/core/CHANGELOG.md 2.0.0-beta.1
```

**Output:**

The script outputs the changelog content for the specified version, excluding the version header itself:

```markdown
### Patch Changes

- Fixed bug in parser
- Updated dependencies
- Improved error messages
```

**Exit codes:**

- `0` - Success (changelog extracted)
- `1` - Invalid arguments (wrong number of arguments)
- `2` - Changelog file not found
- `3` - Version not found in changelog

**Changelog Format:**

The script expects CHANGELOG.md files to follow the standard format:

```markdown
# @kaiord/core

## 1.2.3

### Patch Changes

- Change description

## 1.2.2

### Patch Changes

- Previous change
```

**Features:**

- ✅ Extracts content between version headers
- ✅ Handles multiple versions in same file
- ✅ Supports pre-release versions (e.g., `2.0.0-beta.1`)
- ✅ Preserves markdown formatting
- ✅ Handles complex changelog structures (Major/Minor/Patch sections)
- ✅ Gracefully handles missing changelogs
- ✅ Provides clear error messages

**Integration:**

This script is used by the Changesets workflow (`.github/workflows/changesets.yml`) to automatically extract version-specific changelog content for GitHub releases.

**Tests:**

Run the comprehensive test suite:

```bash
# Unit tests (12 test cases)
./scripts/test-extract-changelog.sh

# Integration tests (with real package files)
./scripts/test-changelog-integration.sh
```

**Test Coverage:**

- ✅ Single version extraction
- ✅ Multiple versions extraction
- ✅ Middle version extraction
- ✅ Oldest version extraction
- ✅ Missing changelog file handling
- ✅ Version not found handling
- ✅ Malformed changelog handling
- ✅ Empty changelog handling
- ✅ Complex formatting preservation
- ✅ Invalid arguments handling
- ✅ Pre-release version support
- ✅ Real package integration

**Error Handling:**

The script provides clear error messages for common issues:

```bash
# Missing file
Error: Changelog file not found: packages/core/CHANGELOG.md

# Version not found
Error: Version 9.9.9 not found in packages/core/CHANGELOG.md

# Invalid arguments
Error: Invalid number of arguments
Usage: ./extract-changelog.sh <changelog-file> <version>
```

**Related Documentation:**

- [Changesets Workflow](../.github/workflows/changesets.yml)
- [Release Workflow](../.github/workflows/release.yml)

### create-release.sh

CLI helper for creating manual package releases with package-scoped tags.

**Purpose:**

This script provides a convenient way to manually create package releases with the correct package-scoped tag format. It validates inputs, checks for version consistency, and optionally creates and pushes the release tag.

**Usage:**

```bash
./scripts/create-release.sh <package-name> <version> [--dry-run]
```

**Examples:**

```bash
# Create release for @kaiord/core v1.2.3
./scripts/create-release.sh @kaiord/core 1.2.3

# Preview release without creating tag (dry-run)
./scripts/create-release.sh @kaiord/cli 0.5.0 --dry-run

# Create pre-release
./scripts/create-release.sh @kaiord/core 2.0.0-beta.1
```

**Options:**

- `--dry-run` - Preview the tag without creating or pushing it

**Exit codes:**

- `0` - Success (tag created and pushed, or dry-run completed)
- `1` - Invalid arguments or usage
- `2` - Package validation failed (unknown package or version mismatch)
- `3` - Tag creation failed
- `4` - Tag push failed

**What it does:**

1. **Validates tag format** - Ensures tag matches `{packageName}@{version}` pattern
2. **Validates package** - Verifies package exists in monorepo
3. **Checks version consistency** - Ensures tag version matches package.json version
4. **Checks for existing tag** - Prevents duplicate tag creation
5. **Creates tag** - Creates git tag locally (unless dry-run)
6. **Pushes tag** - Pushes tag to remote repository (unless dry-run)

**Dry-run mode:**

Use `--dry-run` to preview what would happen without making any changes:

```bash
./scripts/create-release.sh @kaiord/core 1.2.3 --dry-run
```

**Output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Kaiord Release Helper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Package: @kaiord/core
Version: 1.2.3
Tag: @kaiord/core@1.2.3
Mode: Dry run (preview only)

[1/4] Validating tag format...
✅ Tag format is valid

[2/4] Validating package...
✅ Package validated
   Directory: packages/core

[3/4] Checking for existing tag...
✅ Tag does not exist yet

[4/4] Dry run - preview only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Dry Run Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following commands would be executed:

1. Create tag:
   git tag @kaiord/core@1.2.3

2. Push tag:
   git push origin @kaiord/core@1.2.3

ℹ️  No changes were made (dry-run mode)

To create the release for real, run:
  ./scripts/create-release.sh @kaiord/core 1.2.3
```

**Validation:**

The script performs comprehensive validation:

- ✅ Tag format matches package-scoped pattern
- ✅ Package name is valid (@kaiord/core or @kaiord/cli)
- ✅ Package directory exists
- ✅ package.json exists and is valid
- ✅ Version in tag matches version in package.json
- ✅ Tag doesn't already exist

**Error messages:**

The script provides clear, actionable error messages:

```bash
# Invalid tag format
Error: Invalid tag format: core@1.2.3

Expected format: {packageName}@{version}
  - packageName: scoped npm package (e.g., @kaiord/core)
  - version: semantic version (e.g., 1.2.3, 1.0.0-beta.1)

Valid examples:
  @kaiord/core@1.2.3
  @kaiord/cli@0.5.0

# Unknown package
Error: Unknown package: @kaiord/unknown

Valid packages:
  @kaiord/core
  @kaiord/cli

# Version mismatch
Error: Version mismatch!

Tag version:         1.2.3
package.json version: 0.1.1

The version in the release tag must match the version in package.json
Package: @kaiord/core
Location: packages/core/package.json

# Tag already exists
Error: Tag already exists: @kaiord/core@1.2.3

This tag has already been created. To view it:
  git show @kaiord/core@1.2.3

To delete and recreate (use with caution):
  git tag -d @kaiord/core@1.2.3
  git push origin :refs/tags/@kaiord/core@1.2.3
```

**Integration with release workflow:**

When you push a tag created by this script, it automatically triggers the release workflow:

1. Tag is pushed to GitHub
2. Release workflow detects the tag
3. Package is published to npm
4. GitHub release is created with changelog

**Tests:**

Run the comprehensive test suite:

```bash
# Unit tests (23 test cases)
./scripts/test-create-release.sh
```

**Test Coverage:**

- ✅ Valid package names and versions
- ✅ Invalid inputs (missing args, unknown packages, invalid versions)
- ✅ Dry-run mode
- ✅ Version mismatch detection
- ✅ Argument parsing
- ✅ Output format validation
- ✅ Error message clarity

**When to use:**

Use this script when you need to create a manual release:

- Emergency hotfix that bypasses normal changeset flow
- Re-releasing a package after fixing a publishing issue
- Creating a release for testing purposes

**Normal release process:**

For regular releases, use the automated changeset flow:

```bash
# 1. Create changeset
pnpm changeset

# 2. Commit and push
git add .changeset/ && git commit -m 'chore: add changeset' && git push

# 3. Merge "Version Packages" PR
# (Changesets will automatically create package-scoped tags)
```

**Related Documentation:**

- [Release Workflow](../.github/workflows/release.yml)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Release process documentation
