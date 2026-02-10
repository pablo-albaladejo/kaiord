# Deployment Guide

This document provides comprehensive information about deploying Kaiord packages to npm and the Workout SPA Editor to GitHub Pages.

## Table of Contents

- [Package Release Process](#package-release-process)
  - [Overview](#release-overview)
  - [Package-Scoped Release Tags](#package-scoped-release-tags)
  - [Automated Release Workflow](#automated-release-workflow)
  - [Manual Package Release](#manual-package-release)
  - [Release Troubleshooting](#release-troubleshooting)
- [SPA Deployment](#spa-deployment)
  - [Overview](#spa-overview)
  - [Automated Deployment](#automated-deployment)
  - [Manual Deployment](#manual-deployment)
  - [Local Testing](#local-testing)
  - [Troubleshooting](#troubleshooting)
  - [Configuration](#configuration)

---

## Package Release Process

### Release Overview

Kaiord uses an automated release process powered by [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing of npm packages. The monorepo contains two independently versioned packages:

- **@kaiord/core** - Core library for health & fitness data conversion
- **@kaiord/cli** - Command-line interface tool

Each package is released independently with **package-scoped tags** (e.g., `@kaiord/core@1.2.3`, `@kaiord/cli@0.5.0`) to provide clear traceability and better release management.

### Package-Scoped Release Tags

#### Tag Format

Release tags follow the npm package naming convention:

```
{packageName}@{version}
```

**Examples:**

- `@kaiord/core@1.2.3` - Core library version 1.2.3
- `@kaiord/cli@0.5.0` - CLI tool version 0.5.0
- `@kaiord/core@2.0.0-beta.1` - Pre-release version with pre-release identifier
- `@kaiord/core@1.0.0+build.123` - Version with build metadata
- `@kaiord/core@1.0.0-beta.1+exp.sha.5114f85` - Combined pre-release and build metadata

**Tag Format Specification:**

The tag format follows this pattern:

```
{scope}/{package}@{major}.{minor}.{patch}[-{prerelease}][+{buildmetadata}]
```

Where:

- **scope**: npm scope (e.g., `@kaiord`)
- **package**: package name (e.g., `core`, `cli`)
- **major.minor.patch**: semantic version numbers
- **prerelease** (optional): pre-release identifier (e.g., `beta.1`, `alpha.2`, `rc.1`)
- **buildmetadata** (optional): build metadata (e.g., `build.123`, `exp.sha.5114f85`)

**Validation Rules:**

1. ✅ Must include scope prefix (`@kaiord/`)
2. ✅ Must use `@` separator between package and version
3. ✅ Version must follow semantic versioning (MAJOR.MINOR.PATCH)
4. ✅ Pre-release identifiers must start with `-`
5. ✅ Build metadata must start with `+`
6. ❌ Generic tags like `v1.2.3` are not allowed
7. ❌ Unscoped packages like `core@1.2.3` are not allowed
8. ❌ Wrong separators like `@kaiord/core-1.2.3` are not allowed

**Benefits:**

- ✅ Clear package identification in git history
- ✅ Easy filtering of releases per package
- ✅ Selective publishing (only tagged package is published)
- ✅ Better traceability in monorepo
- ✅ Follows npm conventions
- ✅ Supports pre-release versions and build metadata
- ✅ Prevents accidental cross-package releases

#### Viewing Releases by Package

```bash
# List all core releases
git tag -l '@kaiord/core@*'

# List all CLI releases
git tag -l '@kaiord/cli@*'

# View latest release for a package
git tag -l '@kaiord/core@*' | sort -V | tail -n 1

# View all pre-release versions
git tag -l '@kaiord/core@*-*'

# Count releases per package
echo "Core releases: $(git tag -l '@kaiord/core@*' | wc -l)"
echo "CLI releases: $(git tag -l '@kaiord/cli@*' | wc -l)"
```

### Automated Release Workflow

#### Release Process Flow

```
1. Developer creates changeset
   ↓
2. Changeset PR is created/updated
   ↓
3. Maintainer merges "Version Packages" PR
   ↓
4. Changesets creates package-scoped tags
   ↓
5. Release workflow publishes to npm
   ↓
6. GitHub releases are created with changelog
```

#### Step-by-Step Process

**1. Create a Changeset**

When you make changes that should trigger a release:

```bash
# Run changeset CLI
pnpm changeset

# Follow prompts:
# - Select packages to release (core, cli, or both)
# - Select version bump type (major, minor, patch)
# - Write changelog summary
```

This creates a changeset file in `.changeset/` directory.

**2. Commit and Push**

```bash
git add .changeset/
git commit -m "feat: add new feature"
git push origin your-branch
```

**3. Merge PR**

After your PR is reviewed and merged to `main`, the Changesets workflow automatically:

- Creates or updates a "Version Packages" PR
- Bumps versions in `package.json`
- Updates `CHANGELOG.md` files
- Aggregates multiple changesets

**4. Merge "Version Packages" PR**

When ready to release, merge the "Version Packages" PR. This triggers:

- Changesets creates package-scoped tags (e.g., `@kaiord/core@1.2.3`)
- Tags are pushed to GitHub
- GitHub releases are created automatically

**5. Automated Publishing**

The Release workflow (`.github/workflows/release.yml`) automatically:

- Parses the release tag to extract package name and version
- Validates the package and version
- Publishes only the tagged package to npm
- Creates GitHub release with changelog

#### Release Workflow Steps

The release workflow performs these steps:

1. **Parse Release Tag**
   - Uses `scripts/parse-release-tag.sh` to parse and validate tag
   - Extracts package name and version from tag
   - Validates tag format matches `{packageName}@{version}` pattern
   - Supports scoped packages, pre-release versions, and build metadata
   - Example: `@kaiord/core@1.2.3` → package=`@kaiord/core`, version=`1.2.3`
   - Example: `@kaiord/cli@0.5.0-beta.1` → package=`@kaiord/cli`, version=`0.5.0-beta.1`
   - Fails immediately with clear error if tag format is invalid

2. **Validate Package**
   - Uses `scripts/validate-package.sh` to validate package and version
   - Verifies package name is known (`@kaiord/core` or `@kaiord/cli`)
   - Checks package directory exists (`packages/core/` or `packages/cli/`)
   - Validates `package.json` exists and is valid JSON
   - Compares tag version with `package.json` version
   - Ensures exact version match before publishing
   - Fails with detailed error if validation fails

3. **Build Packages**
   - Runs `pnpm -r build` to build all packages
   - Ensures dependencies are built correctly (core is built before CLI)
   - Validates build artifacts exist in `dist/` directories
   - Checks for TypeScript declarations (`.d.ts` files)
   - Verifies both ESM and CommonJS outputs are generated

4. **Publish to npm**
   - Publishes only the tagged package using `pnpm --filter {packageName}`
   - Uses retry logic with exponential backoff (3 attempts: 5s, 10s, 20s delays)
   - Includes npm provenance for supply chain security (`--provenance` flag)
   - Uses `--no-git-checks` to skip git status validation
   - Uses `--access public` for public package publishing
   - Requires `NPM_TOKEN` secret with publish permissions
   - Logs each retry attempt with delay information

5. **Create GitHub Release**
   - Creates release with package-scoped tag
   - Includes version-specific changelog extracted from `CHANGELOG.md`
   - Adds npm package link with version-specific URL
   - Formats release notes with package information
   - Uses `scripts/extract-changelog.sh` to extract relevant changelog section
   - Skips if release already exists (idempotent)

6. **Handle Failures**
   - Creates GitHub issue on failure with detailed diagnostics
   - Notifies maintainers via issue comments with `@` mention
   - Includes remediation steps and troubleshooting guide
   - Provides workflow run URL for debugging
   - Lists common causes and solutions
   - Adds critical priority label for immediate attention
   - Workflow fails to prevent silent errors and ensure visibility

### Manual Package Release

If you need to create a manual release (not recommended):

#### Using Scripts

The repository provides utility scripts for tag parsing and package validation:

**1. Parse and Validate Tag Format:**

```bash
# Parse a release tag
./scripts/parse-release-tag.sh "@kaiord/core@1.2.3"

# Output (on success):
# PACKAGE_NAME=@kaiord/core
# VERSION=1.2.3

# Test with pre-release version
./scripts/parse-release-tag.sh "@kaiord/core@2.0.0-beta.1"

# Output:
# PACKAGE_NAME=@kaiord/core
# VERSION=2.0.0-beta.1

# Test with invalid tag (will fail)
./scripts/parse-release-tag.sh "v1.2.3"
# Error: Invalid tag format: v1.2.3
# Expected format: {packageName}@{version}
```

**2. Validate Package and Version:**

```bash
# Validate package exists and version matches
./scripts/validate-package.sh "@kaiord/core" "1.2.3"

# Output (on success):
# PACKAGE_DIR=packages/core

# Test with version mismatch (will fail)
./scripts/validate-package.sh "@kaiord/core" "9.9.9"
# Error: Version mismatch!
# Tag version:          9.9.9
# package.json version: 1.2.3

# Test with unknown package (will fail)
./scripts/validate-package.sh "@kaiord/unknown" "1.0.0"
# Error: Unknown package: @kaiord/unknown
# Valid packages:
#   @kaiord/core
#   @kaiord/cli
```

**3. Extract Changelog for Version:**

```bash
# Extract changelog section for specific version
./scripts/extract-changelog.sh packages/core/CHANGELOG.md 1.2.3

# Output: Changelog content for version 1.2.3

# Test with non-existent version (will fail)
./scripts/extract-changelog.sh packages/core/CHANGELOG.md 9.9.9
# Error: Version 9.9.9 not found in packages/core/CHANGELOG.md
```

**Script Exit Codes:**

- `0` - Success
- `1` - Invalid arguments or tag format
- `2` - Unknown package name
- `3` - Package directory or version not found
- `4` - package.json not found
- `5` - Invalid package.json (not valid JSON)
- `6` - Version mismatch

#### Manual Tag Creation

```bash
# 1. Ensure package.json version is updated
cat packages/core/package.json | grep version
# "version": "1.2.3"

# 2. Validate tag before creating
./scripts/parse-release-tag.sh "@kaiord/core@1.2.3"
./scripts/validate-package.sh "@kaiord/core" "1.2.3"

# 3. Create package-scoped tag
git tag @kaiord/core@1.2.3

# 4. Push tag to trigger release
git push origin @kaiord/core@1.2.3

# 5. Monitor release workflow
# Go to: https://github.com/pablo-albaladejo/kaiord/actions
```

**⚠️ Warning:** Manual releases bypass changeset validation and may cause inconsistencies. Always use the automated changeset workflow when possible.

**When to Use Manual Releases:**

- ✅ Emergency hotfix that can't wait for changeset PR
- ✅ Fixing a failed automated release
- ✅ Testing release workflow changes
- ❌ Regular feature releases (use changesets)
- ❌ Multiple package releases (use changesets)

#### Manual npm Publishing

If automated publishing fails and you need to publish manually:

```bash
# 1. Authenticate with npm
npm login
# Follow prompts to enter credentials

# 2. Verify authentication
npm whoami
# Should output your npm username

# 3. Build all packages
pnpm -r build

# 4. Verify build artifacts
ls packages/core/dist/
# Should contain: index.js, index.cjs, index.d.ts

# 5. Publish specific package
pnpm --filter @kaiord/core publish --access public

# Or for CLI
pnpm --filter @kaiord/cli publish --access public

# 6. Verify publication
npm view @kaiord/core version
# Should show the newly published version

# 7. Create GitHub release manually (if needed)
gh release create @kaiord/core@1.2.3 \
  --title "@kaiord/core v1.2.3" \
  --notes "$(./scripts/extract-changelog.sh packages/core/CHANGELOG.md 1.2.3)"
```

**Manual Publishing Checklist:**

- [ ] Verify `package.json` version matches intended release version
- [ ] Run `pnpm -r build` successfully
- [ ] Verify build artifacts exist in `dist/` directory
- [ ] Authenticate with npm (`npm login`)
- [ ] Publish package with `pnpm --filter {package} publish --access public`
- [ ] Verify package appears on npm registry
- [ ] Create GitHub release with correct tag
- [ ] Update CHANGELOG.md if not already updated
- [ ] Notify team of manual release

### Release Troubleshooting

#### Tag Parsing Failures

**Symptom:** Release workflow fails at "Parse release tag" step

**Common Causes:**

- Invalid tag format (e.g., `v1.2.3` instead of `@kaiord/core@1.2.3`)
- Missing `@` separator
- Unscoped package name
- Invalid semantic version

**Solution:**

```bash
# Verify tag format
./scripts/parse-release-tag.sh "your-tag-here"

# Valid examples:
./scripts/parse-release-tag.sh "@kaiord/core@1.2.3"
./scripts/parse-release-tag.sh "@kaiord/cli@0.5.0"

# Invalid examples (will fail):
./scripts/parse-release-tag.sh "v1.2.3"           # Generic tag
./scripts/parse-release-tag.sh "core@1.2.3"      # Unscoped
./scripts/parse-release-tag.sh "@kaiord/core-1.2.3"  # Wrong separator
```

**Expected Output:**

```
PACKAGE_NAME=@kaiord/core
VERSION=1.2.3
```

#### Package Validation Failures

**Symptom:** Release workflow fails at "Validate package" step

**Common Causes:**

- Unknown package name
- Package directory doesn't exist
- Version mismatch between tag and `package.json`
- Invalid `package.json` file

**Solution:**

```bash
# Validate package and version
./scripts/validate-package.sh "@kaiord/core" "1.2.3"

# Check package.json version
node -p "require('./packages/core/package.json').version"

# Verify package directory exists
ls -la packages/core/
```

**Expected Output:**

```
PACKAGE_DIR=packages/core
```

**Version Mismatch Error:**

```
Error: Version mismatch!

Tag version:          1.2.3
package.json version: 1.2.2

The version in the release tag must match the version in package.json
```

**Fix:** Ensure the "Version Packages" PR was merged before creating the release tag.

#### Publishing Failures

**Symptom:** Release workflow fails at "Publish package" step

**Common Causes:**

1. **Invalid NPM_TOKEN**
   - Token expired
   - Token lacks publish permissions
   - Token not configured in repository secrets

2. **Network Issues**
   - npm registry temporarily unavailable
   - Connection timeout

3. **Version Conflict**
   - Version already published to npm
   - Cannot republish same version

4. **Package Configuration**
   - Invalid `package.json`
   - Missing required fields
   - Build artifacts missing

**Solutions:**

**1. Verify NPM Token:**

```bash
# Check token validity (requires npm CLI)
npm whoami --registry https://registry.npmjs.org

# Expected output: your-npm-username
```

**2. Check npm Registry Status:**

- Visit: https://status.npmjs.org/
- Verify no ongoing incidents

**3. Verify Package Version:**

```bash
# Check current published version
npm view @kaiord/core version

# Check local version
node -p "require('./packages/core/package.json').version"

# If versions match, the version is already published
```

**4. Check Build Artifacts:**

```bash
# Verify build succeeded
ls -la packages/core/dist/

# Should contain:
# - index.js (ESM)
# - index.cjs (CommonJS)
# - index.d.ts (TypeScript declarations)
```

**5. Manual Publishing (if needed):**

```bash
# Authenticate
npm login

# Build packages
pnpm -r build

# Publish manually
pnpm --filter @kaiord/core publish --access public
```

#### GitHub Release Creation Failures

**Symptom:** Package published successfully but GitHub release not created

**Common Causes:**

- Changelog extraction failed
- GitHub API rate limit
- Insufficient permissions
- Release already exists

**Solution:**

```bash
# Extract changelog manually
./scripts/extract-changelog.sh packages/core/CHANGELOG.md 1.2.3

# Check if release already exists
gh release view @kaiord/core@1.2.3

# Create release manually if needed
gh release create @kaiord/core@1.2.3 \
  --title "@kaiord/core v1.2.3" \
  --notes "$(./scripts/extract-changelog.sh packages/core/CHANGELOG.md 1.2.3)"
```

#### Retry Logic

The release workflow includes automatic retry logic for npm publishing:

- **Attempts:** 3 retries with exponential backoff
- **Delays:** 5s, 10s, 20s between attempts
- **Reason:** Handles transient network issues

If all retries fail:

- Workflow creates a GitHub issue with detailed diagnostics
- Maintainers are notified via issue comments
- Issue includes remediation steps and troubleshooting guide

#### Failure Notifications

When a release fails, the workflow automatically:

1. **Creates GitHub Issue:**
   - Title: `🚨 Release failed: {package}@{version} ({tag})`
   - Labels: `release`, `bug`, `automated`, `priority-critical`
   - Assigned to: Repository owner

2. **Issue Contents:**
   - Package and version information
   - Workflow run link
   - Error details
   - Common causes
   - Remediation steps
   - Troubleshooting checklist

3. **Notification Comment:**
   - Mentions repository owner
   - Provides immediate alert
   - Links to workflow logs

#### Debugging Workflow Failures

**1. View Workflow Logs:**

- Go to [Actions tab](https://github.com/pablo-albaladejo/kaiord/actions)
- Click on failed workflow run
- Expand failed step to see error details

**2. Enable Debug Logging:**

- Go to repository Settings → Secrets and variables → Actions
- Add secret: `ACTIONS_STEP_DEBUG` = `true`
- Re-run workflow

**3. Test Locally:**

```bash
# Test tag parsing
./scripts/parse-release-tag.sh "@kaiord/core@1.2.3"

# Test package validation
./scripts/validate-package.sh "@kaiord/core" "1.2.3"

# Test changelog extraction
./scripts/extract-changelog.sh packages/core/CHANGELOG.md 1.2.3

# Test build
pnpm -r build

# Test publish (dry-run)
pnpm --filter @kaiord/core publish --dry-run --access public
```

**4. Check Workflow Configuration:**

```bash
# Verify workflow syntax
cat .github/workflows/release.yml

# Verify changesets configuration
cat .changeset/config.json

# Verify package.json versions
cat packages/core/package.json | grep version
cat packages/cli/package.json | grep version
```

#### Common Error Messages

**"Invalid tag format"**

```
❌ Invalid tag format: v1.2.3
Expected format: {packageName}@{version}
Examples: @kaiord/core@1.2.3, @kaiord/cli@0.5.0
```

**Fix:** Use package-scoped tag format

**"Unknown package"**

```
❌ Unknown package: @kaiord/unknown
Valid packages: @kaiord/core, @kaiord/cli
```

**Fix:** Use valid package name

**"Version mismatch"**

```
❌ Version mismatch!
Tag version: 1.2.3
package.json version: 1.2.2
```

**Fix:** Merge "Version Packages" PR first

**"Failed to publish after 3 attempts"**

```
❌ Failed to publish @kaiord/core@1.2.3 after 3 attempts
```

**Fix:** Check npm registry status, verify token, try manual publishing

### Release Best Practices

**Before Creating Changeset:**

1. ✅ Run tests: `pnpm -r test`
2. ✅ Run linting: `pnpm -r lint`
3. ✅ Build packages: `pnpm -r build`
4. ✅ Test locally: `pnpm -r test:watch`

**When Creating Changeset:**

1. ✅ Select correct packages (core, cli, or both)
2. ✅ Choose appropriate version bump (major, minor, patch)
3. ✅ Write clear, descriptive changelog summary
4. ✅ Follow [Conventional Commits](https://www.conventionalcommits.org/)

**Before Merging "Version Packages" PR:**

1. ✅ Review version bumps are correct
2. ✅ Review changelog entries are accurate
3. ✅ Verify all tests pass in CI
4. ✅ Ensure no breaking changes without major version bump

**After Release:**

1. ✅ Verify package published to npm
2. ✅ Verify GitHub release created
3. ✅ Test installation: `npm install @kaiord/core@latest`
4. ✅ Verify changelog on npm package page

### Monitoring Releases

**GitHub Actions:**

- Monitor workflow runs in [Actions tab](https://github.com/pablo-albaladejo/kaiord/actions)
- Check for failed workflows
- Review workflow logs for warnings

**npm Registry:**

- Verify packages published: https://www.npmjs.com/package/@kaiord/core
- Check download statistics
- Monitor package health

**GitHub Releases:**

- View releases: https://github.com/pablo-albaladejo/kaiord/releases
- Filter by package using tag search
- Review release notes and changelogs

---

## SPA Deployment

### SPA Overview

The Workout SPA Editor is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The deployment process:

1. Builds the `@kaiord/core` package (required dependency)
2. Builds the SPA with the correct base path for GitHub Pages
3. Verifies build artifacts exist
4. Deploys to GitHub Pages

**Live URL**: https://pablo-albaladejo.github.io/kaiord/

## Automated Deployment

### Workflow Triggers

The deployment workflow (`.github/workflows/deploy-spa-editor.yml`) automatically runs when:

- **Push to main**: Changes are pushed to the `main` branch
- **Relevant files changed**:
  - `packages/workout-spa-editor/**` (SPA source files)
  - `packages/core/**` (core package files)
  - `.github/workflows/deploy-spa-editor.yml` (workflow file)
- **Manual trigger**: Via GitHub Actions UI (workflow_dispatch)

### Deployment Process

```
1. Checkout code
   ↓
2. Setup pnpm + Node.js 20
   ↓
3. Install dependencies (frozen lockfile)
   ↓
4. Build @kaiord/core package
   ↓
5. Verify core build artifacts
   ↓
6. Build SPA with base path
   ↓
7. Verify SPA build artifacts
   ↓
8. Upload to GitHub Pages
   ↓
9. Deploy to production
```

### Monitoring Deployments

1. **View workflow runs**: Go to [Actions tab](https://github.com/pablo-albaladejo/kaiord/actions)
2. **Check deployment status**: Look for "Deploy Workout SPA Editor to GitHub Pages" workflow
3. **View logs**: Click on a workflow run to see detailed logs
4. **Verify deployment**: Visit https://pablo-albaladejo.github.io/kaiord/

### Deployment Notifications

- **Success**: Green checkmark on commit in GitHub
- **Failure**: Red X on commit with email notification
- **In Progress**: Yellow dot while workflow is running

## Manual Deployment

### Prerequisites

- Node.js 20.x or higher
- pnpm 9.x or higher
- Write access to the repository

### Steps

1. **Build locally**:

   ```bash
   # From repository root
   pnpm install --frozen-lockfile
   pnpm --filter @kaiord/core build
   VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
   ```

2. **Verify build**:

   ```bash
   # Check that artifacts exist
   ls -la packages/workout-spa-editor/dist/
   ```

3. **Trigger workflow manually**:
   - Go to [Actions tab](https://github.com/pablo-albaladejo/kaiord/actions)
   - Select "Deploy Workout SPA Editor to GitHub Pages"
   - Click "Run workflow"
   - Select branch (usually `main`)
   - Click "Run workflow" button

4. **Wait for deployment**:
   - Monitor workflow progress in Actions tab
   - Deployment typically takes 2-3 minutes

5. **Verify deployment**:
   - Visit https://pablo-albaladejo.github.io/kaiord/
   - Test core functionality (load, edit, save workout)
   - Check browser console for errors

### Emergency Rollback

If a deployment introduces critical issues:

1. **Revert the commit**:

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Or deploy from previous commit**:
   - Go to Actions tab
   - Find last successful deployment
   - Click "Re-run all jobs"

3. **Or disable workflow temporarily**:
   - Edit `.github/workflows/deploy-spa-editor.yml`
   - Comment out the `on:` triggers
   - Push to main

## Local Testing

### Using the CI Testing Script

Before pushing changes, test the deployment process locally:

```bash
# Make script executable (first time only)
chmod +x scripts/test-ci-workflows.sh

# Run all tests
./scripts/test-ci-workflows.sh
```

The script validates:

- ✅ Core package builds successfully
- ✅ SPA builds with core dependency
- ✅ Build artifacts exist and are valid
- ✅ Base path is correctly configured
- ✅ Dependency order is enforced
- ✅ Frozen lockfile is up to date

### Manual Local Testing

1. **Clean build test**:

   ```bash
   # Remove all build artifacts
   rm -rf packages/*/dist packages/*/node_modules/.vite

   # Install dependencies
   pnpm install --frozen-lockfile

   # Build core
   pnpm --filter @kaiord/core build

   # Build SPA
   VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
   ```

2. **Verify artifacts**:

   ```bash
   # Core artifacts
   ls packages/core/dist/index.js
   ls packages/core/dist/index.d.ts

   # SPA artifacts
   ls packages/workout-spa-editor/dist/index.html
   ls packages/workout-spa-editor/dist/assets/
   ```

3. **Test base path**:

   ```bash
   # Check that index.html references assets with correct base path
   grep 'src="/kaiord/' packages/workout-spa-editor/dist/index.html
   grep 'href="/kaiord/' packages/workout-spa-editor/dist/index.html
   ```

4. **Preview locally**:

   ```bash
   cd packages/workout-spa-editor
   pnpm preview
   ```

   Note: Local preview uses `/` as base path, not `/kaiord/`. To test with the correct base path, use a local server:

   ```bash
   # Using Python
   cd packages/workout-spa-editor/dist
   python3 -m http.server 8000
   # Visit http://localhost:8000/kaiord/ (note the trailing slash)

   # Using Node.js serve
   npx serve packages/workout-spa-editor/dist -p 8000
   # Visit http://localhost:8000/kaiord/
   ```

## Troubleshooting

### Common Issues

#### 1. Build Fails: "Cannot resolve @kaiord/core"

**Symptom**: SPA build fails with module resolution error

**Cause**: Core package not built before SPA build

**Solution**:

```bash
# Build core first
pnpm --filter @kaiord/core build

# Then build SPA
pnpm --filter @kaiord/workout-spa-editor build
```

#### 2. Deployment Succeeds but Site Shows 404

**Symptom**: GitHub Pages URL returns 404 Not Found

**Causes**:

- GitHub Pages not enabled for repository
- Wrong branch configured for GitHub Pages
- Deployment still in progress

**Solutions**:

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"
   - Save

2. **Check deployment status**:
   - Go to Actions tab
   - Verify deployment completed successfully
   - Wait 1-2 minutes for DNS propagation

3. **Verify branch**:
   - Ensure pushing to `main` branch
   - Check workflow triggers in `.github/workflows/deploy-spa-editor.yml`

#### 3. Assets Fail to Load (404 on CSS/JS)

**Symptom**: Site loads but CSS/JS files return 404

**Cause**: Incorrect base path configuration

**Solution**:

1. **Check base path in workflow**:

   ```yaml
   env:
     VITE_BASE_PATH: ${{ github.event.repository.name == format('{0}.github.io', github.repository_owner) && '/' || format('/{0}/', github.event.repository.name) }}
   ```

2. **Verify in index.html**:

   ```bash
   # Should show /kaiord/assets/...
   grep 'src="' packages/workout-spa-editor/dist/index.html
   ```

3. **Rebuild with correct base path**:
   ```bash
   VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
   ```

#### 4. Workflow Fails: "Frozen lockfile validation failed"

**Symptom**: Workflow fails during `pnpm install --frozen-lockfile`

**Cause**: `pnpm-lock.yaml` is out of sync with `package.json`

**Solution**:

```bash
# Update lockfile
pnpm install

# Commit changes
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
git push origin main
```

#### 5. Workflow Fails: "Core build verification failed"

**Symptom**: Workflow fails at "Verify core build" step

**Cause**: Core package build didn't produce expected artifacts

**Solution**:

1. **Check core build locally**:

   ```bash
   pnpm --filter @kaiord/core build
   ls packages/core/dist/
   ```

2. **Verify tsup configuration**:
   - Check `packages/core/tsup.config.ts`
   - Ensure `dts: true` for TypeScript declarations
   - Ensure `format: ['esm', 'cjs']` for output formats

3. **Check for build errors**:
   - Review workflow logs in Actions tab
   - Look for TypeScript compilation errors
   - Fix errors and push again

#### 6. Site Works Locally but Not on GitHub Pages

**Symptom**: Site works with `pnpm preview` but fails on GitHub Pages

**Causes**:

- Base path mismatch
- Hardcoded absolute URLs
- Missing environment variables

**Solutions**:

1. **Test with correct base path**:

   ```bash
   VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
   cd packages/workout-spa-editor/dist
   python3 -m http.server 8000
   # Visit http://localhost:8000/kaiord/
   ```

2. **Check for hardcoded URLs**:

   ```bash
   # Should not find any
   grep -r 'src="http' packages/workout-spa-editor/dist/
   grep -r 'href="http' packages/workout-spa-editor/dist/
   ```

3. **Verify Vite config**:
   ```typescript
   // packages/workout-spa-editor/vite.config.ts
   export default defineConfig({
     base: process.env.VITE_BASE_PATH || "/",
     // ...
   });
   ```

### Debugging Workflow Failures

1. **View detailed logs**:
   - Go to Actions tab
   - Click on failed workflow run
   - Click on failed job
   - Expand failed step to see error details

2. **Enable debug logging**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `ACTIONS_STEP_DEBUG` = `true`
   - Re-run workflow

3. **Test locally with CI script**:

   ```bash
   ./scripts/test-ci-workflows.sh
   ```

4. **Check workflow syntax**:

   ```bash
   # Install act (GitHub Actions local runner)
   brew install act  # macOS
   # or
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Test workflow locally
   act -l  # List workflows
   act push  # Run push event workflows
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check workflow logs**: Detailed error messages in Actions tab
2. **Run CI testing script**: `./scripts/test-ci-workflows.sh`
3. **Review recent changes**: Check commits that may have broken deployment
4. **Open an issue**: [GitHub Issues](https://github.com/pablo-albaladejo/kaiord/issues)
5. **Check GitHub Pages status**: [GitHub Status](https://www.githubstatus.com/)

## Configuration

### Repository Settings

Required GitHub repository settings:

1. **GitHub Pages**:
   - Settings → Pages
   - Source: "GitHub Actions"
   - Branch: Not applicable (managed by workflow)

2. **Workflow Permissions**:
   - Settings → Actions → General
   - Workflow permissions: "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests: Enabled

3. **Secrets** (none required):
   - Deployment uses `GITHUB_TOKEN` automatically
   - No manual secrets needed

### Environment Variables

The deployment workflow uses these environment variables:

| Variable         | Value      | Purpose                            |
| ---------------- | ---------- | ---------------------------------- |
| `VITE_BASE_PATH` | `/kaiord/` | Base path for GitHub Pages routing |
| `NODE_VERSION`   | `20`       | Node.js version for build          |

### Base Path Logic

The base path is automatically determined:

```yaml
VITE_BASE_PATH: ${{
  github.event.repository.name == format('{0}.github.io', github.repository_owner)
  && '/'
  || format('/{0}/', github.event.repository.name)
}}
```

- **User/Org page** (`owner.github.io`): Base path = `/`
- **Project page** (`owner/repo`): Base path = `/repo/`

For this repository (`pablo-albaladejo/kaiord`):

- Repository name: `kaiord`
- Owner: `pablo-albaladejo`
- Not a user/org page → Base path: `/kaiord/`

### Vite Configuration

The SPA uses this Vite configuration for deployment:

```typescript
// packages/workout-spa-editor/vite.config.ts
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    outDir: "dist",
    sourcemap: true,
    minify: "terser",
    target: "es2020",
  },
});
```

### Workflow Configuration

Key workflow settings:

```yaml
# Trigger on push to main with relevant file changes
on:
  push:
    branches: [main]
    paths:
      - "packages/workout-spa-editor/**"
      - "packages/core/**"
      - ".github/workflows/deploy-spa-editor.yml"
  workflow_dispatch: # Allow manual triggering

# Required permissions for GitHub Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Prevent concurrent deployments
concurrency:
  group: "pages"
  cancel-in-progress: false
```

## Best Practices

### Before Pushing to Main

1. **Test locally**:

   ```bash
   ./scripts/test-ci-workflows.sh
   ```

2. **Run tests**:

   ```bash
   pnpm -r test
   ```

3. **Check linting**:

   ```bash
   pnpm -r lint
   ```

4. **Verify build**:
   ```bash
   pnpm -r build
   ```

### During Development

1. **Use feature branches**: Don't push directly to `main`
2. **Test in PR**: Create PR to see CI checks before merging
3. **Review workflow logs**: Check Actions tab after merge
4. **Verify deployment**: Test live site after deployment

### Monitoring

1. **Check deployment status**: After each push to `main`
2. **Test live site**: Verify functionality works correctly
3. **Monitor errors**: Check browser console for JavaScript errors
4. **Review logs**: Periodically review workflow logs for warnings

### Performance

1. **Bundle size**: Monitor bundle size in build logs
2. **Load time**: Test site load time on different networks
3. **Caching**: Leverage browser caching for assets
4. **CDN**: Consider using Cloudflare for better performance

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)

## Related Documentation

- [README.md](./README.md) - Project overview and quick start
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [packages/workout-spa-editor/README.md](./packages/workout-spa-editor/README.md) - SPA documentation
