# Deployment Guide

This document provides comprehensive information about deploying Kaiord packages and applications.

## Table of Contents

- [Overview](#overview)
- [GitHub Pages Deployment (SPA)](#github-pages-deployment-spa)
- [npm Package Publishing](#npm-package-publishing)
- [CI/CD Workflows](#cicd-workflows)
- [Security Guidelines](#security-guidelines)
- [Troubleshooting](#troubleshooting)

## Overview

Kaiord uses automated CI/CD pipelines for:

- **GitHub Pages**: Automatic deployment of the Workout SPA Editor
- **npm Publishing**: Automated package releases to npm registry
- **Security Scanning**: Weekly vulnerability audits
- **Version Management**: Automated versioning with Changesets

All deployments are triggered automatically when changes are pushed to the `main` branch or when releases are created.

## GitHub Pages Deployment (SPA)

### Live URL

The Workout SPA Editor is deployed at: https://pablo-albaladejo.github.io/kaiord/

### Automated Deployment

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

### Base Path Configuration

The application automatically configures the base path based on the repository:

- **User/Organization site** (`username.github.io`): Base path = `/`
- **Project site** (`username/repo`): Base path = `/repo/`

For this repository (`pablo-albaladejo/kaiord`):

- Repository name: `kaiord`
- Owner: `pablo-albaladejo`
- Base path: `/kaiord/`

### Manual Deployment

To manually trigger a deployment:

1. Go to [Actions tab](https://github.com/pablo-albaladejo/kaiord/actions)
2. Select "Deploy Workout SPA Editor to GitHub Pages"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow" button

### Local Testing

Test the deployment process locally:

```bash
# Make script executable (first time only)
chmod +x scripts/test-ci-workflows.sh

# Run all tests
./scripts/test-ci-workflows.sh
```

Or test manually:

```bash
# Build with production base path
VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build

# Preview locally
cd packages/workout-spa-editor/dist
python3 -m http.server 8000
# Visit http://localhost:8000/kaiord/
```

## npm Package Publishing

### Publishing Methods

Kaiord supports two publishing methods:

1. **Trusted Publishing** (Recommended) - No tokens needed
2. **Token-Based Publishing** (Legacy) - Uses npm automation tokens

### Trusted Publishing (Recommended)

**Trusted Publishing** uses OpenID Connect (OIDC) for authentication, eliminating the need for tokens.

#### Benefits

- ✅ **No secrets needed** - Uses OIDC for authentication
- ✅ **Automatic verification** - npm verifies package origin
- ✅ **Provenance attestation** - Cryptographic proof of package source
- ✅ **No token rotation** - No tokens to expire or manage
- ✅ **Better security** - Eliminates token theft risk

#### Setup Steps

**Step 1: First Publish (Bootstrap)**

For the first publish, you need to use a token or publish manually:

```bash
# Login to npm
npm login

# Build packages
pnpm -r build

# Publish manually
pnpm --filter @kaiord/core publish --access public
```

**Step 2: Enable Trusted Publishing on npm**

1. Go to your package settings: https://www.npmjs.com/package/@kaiord/core
2. Click on "Settings" tab
3. Scroll to "Publishing access"
4. Click "Configure trusted publishers"
5. Add GitHub Actions as trusted publisher:
   - Provider: **GitHub Actions**
   - Repository owner: `pablo-albaladejo`
   - Repository name: `kaiord`
   - Workflow name: `release.yml` (or leave empty)
   - Environment: (leave empty)
6. Click "Add"

**Step 3: Workflow Configuration**

The workflow is already configured with:

```yaml
permissions:
  id-token: write # Required for npm provenance
  contents: write
  packages: write

jobs:
  publish:
    steps:
      - name: Publish package
        run: pnpm publish --provenance # Enables trusted publishing
```

#### Verification

Check if trusted publishing is enabled:

```bash
# View provenance for a published package
npm view @kaiord/core --json | jq '.dist.attestations'
```

You should see provenance information with SLSA predicate type.

### Token-Based Publishing (Legacy)

If you prefer using tokens, follow these steps:

#### Quick Setup

```bash
pnpm setup:npm
```

The script will:

1. Check if you're logged in to npm
2. Guide you through token creation
3. Configure GitHub secrets automatically
4. Verify the setup

#### Manual Token Creation

1. **Create npm token:**
   - Go to https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens/granular-access-tokens/new
   - Token name: `kaiord-ci-cd`
   - Expiration: 90 days (recommended)
   - Packages: Select `@kaiord/core` with "Read and write"
   - Organizations: (leave empty)
   - IP ranges: (leave empty)
   - Click "Generate Token"

2. **Add to GitHub:**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste the token
   - Click "Add secret"

#### Token Rotation

Tokens should be rotated every 90 days:

1. Create new token with same configuration
2. Update GitHub Secret `NPM_TOKEN` with new token
3. Test that CI/CD works
4. Revoke old token

### Version Management with Changesets

Kaiord uses Changesets for version management and changelog generation.

#### Adding a Changeset

When you make changes that should be included in the next release:

```bash
pnpm exec changeset
```

This will prompt you to:

1. Select which packages have changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

#### Changeset Types

- **Major (breaking change):** `1.0.0` → `2.0.0`
  - Breaking API changes
  - Removed features
  - Incompatible changes

- **Minor (new feature):** `1.0.0` → `1.1.0`
  - New features
  - Backward-compatible additions
  - New functionality

- **Patch (bug fix):** `1.0.0` → `1.0.1`
  - Bug fixes
  - Documentation updates
  - Performance improvements

#### Release Workflow

1. **Create feature branch:** `git checkout -b feature/new-feature`
2. **Make changes:** Implement your feature
3. **Add changeset:** `pnpm exec changeset`
4. **Commit:** `git commit -am "feat: add new feature"`
5. **Push and create PR:** `git push origin feature/new-feature`
6. **Merge to main:** After PR approval
7. **Automatic PR creation:** Changesets workflow creates "Version Packages" PR
8. **Review and merge:** Review the version bumps and changelogs
9. **Automatic release:** Release workflow publishes to npm

## CI/CD Workflows

### Workflow Overview

Kaiord uses several GitHub Actions workflows for automation:

#### 1. CI Workflow (`ci.yml`)

**Purpose:** Validates code quality, runs tests, and generates coverage reports.

**Triggers:**

- Pull requests (opened, synchronize, reopened)
- Push to `main` branch

**Jobs:**

- `detect-changes`: Analyzes git diff to determine which packages need testing
- `lint`: Runs ESLint and Prettier checks
- `typecheck`: Verifies TypeScript types compile without errors
- `test`: Runs tests with coverage for affected packages
- `build`: Verifies packages build successfully

#### 2. Security Audit Workflow (`security.yml`)

**Purpose:** Scans dependencies for security vulnerabilities.

**Triggers:**

- Weekly schedule (Mondays at 9:00 AM UTC)
- Pull requests that modify `package.json` or `pnpm-lock.yaml`
- Manual dispatch

**Behavior by Severity:**

| Severity | Workflow Status      | GitHub Issue | PR Comment |
| -------- | -------------------- | ------------ | ---------- |
| Critical | ❌ Fail              | ✅ Yes       | ✅ Yes     |
| High     | ❌ Fail              | ✅ Yes       | ✅ Yes     |
| Moderate | ⚠️ Pass with warning | ❌ No        | ✅ Yes     |
| Low      | ⚠️ Pass with warning | ❌ No        | ✅ Yes     |

#### 3. Changesets Workflow (`changesets.yml`)

**Purpose:** Automates version bumping and changelog generation.

**Triggers:**

- Push to `main` branch

**Jobs:**

- `version`: Creates or updates "Version Packages" PR
- Generates changelogs based on changeset files
- Triggers release workflow when PR is merged

#### 4. Release Workflow (`release.yml`)

**Purpose:** Builds and publishes packages to npm when a release is created.

**Triggers:**

- Release published event

**Jobs:**

- `publish`: Builds packages and publishes to npm registry
- Creates GitHub deployment
- Updates README badges

### Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Pull Request / Push to Main                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CI Workflow (ci.yml)                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ detect-      │  │ lint         │  │ typecheck    │     │
│  │ changes      │→ │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ test         │  │ build        │                       │
│  │ (matrix)     │  │              │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Merge to Main                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Changesets Workflow (changesets.yml)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Creates/Updates "Version Packages" PR                │  │
│  │ - Bumps versions                                     │  │
│  │ - Generates changelogs                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Merge "Version Packages" PR                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Create GitHub Release                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Release Workflow (release.yml)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Publishes packages to npm                            │  │
│  │ - @kaiord/core                                       │  │
│  │ - @kaiord/cli                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Required Secrets

#### NPM_TOKEN (Optional with Trusted Publishing)

**Purpose:** Authenticates with npm registry for publishing packages.

**Required:** Only if using token-based publishing (not needed for trusted publishing)

**Setup:**

1. Create npm token (see Token-Based Publishing section)
2. Add to GitHub: Settings → Secrets and variables → Actions
3. Name: `NPM_TOKEN`
4. Value: Paste the token

#### CODECOV_TOKEN (Optional)

**Purpose:** Uploads coverage reports to Codecov.

**Required:** Only for private repositories (optional for public)

**Setup:**

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Copy the upload token
4. Add to GitHub: Settings → Secrets and variables → Actions
5. Name: `CODECOV_TOKEN`
6. Value: Paste the token

## Security Guidelines

### Workflow Permissions

All workflows use minimal required permissions:

```yaml
permissions:
  contents: read # Read repository contents
  pages: write # Deploy to GitHub Pages (SPA only)
  id-token: write # OIDC authentication (trusted publishing)
  issues: write # Create security issues (audit only)
  pull-requests: write # Comment on PRs (audit only)
```

### Secret Management

- ✅ **Never log secrets** - Secrets are masked in workflow logs
- ✅ **Use GitHub Secrets** - Store tokens in repository secrets
- ✅ **Rotate regularly** - Rotate tokens every 90 days
- ✅ **Least privilege** - Use granular tokens with minimal permissions
- ✅ **Audit access** - Review secret access regularly

### Security Scanning

The security audit workflow runs weekly and on dependency changes:

```bash
# Run audit locally
pnpm audit

# With specific level
pnpm audit --audit-level=moderate

# JSON output
pnpm audit --json
```

### Remediation Steps

When vulnerabilities are found:

1. **Review vulnerabilities:**

   ```bash
   pnpm audit
   ```

2. **Update dependencies:**

   ```bash
   pnpm update
   ```

3. **Test changes:**

   ```bash
   pnpm test
   pnpm build
   ```

4. **Commit and push:**
   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "fix: update dependencies to address security vulnerabilities"
   git push
   ```

## Troubleshooting

### GitHub Pages Deployment

#### Assets Fail to Load (404 on CSS/JS)

**Symptom:** Site loads but CSS/JS files return 404

**Cause:** Incorrect base path configuration

**Solution:**

1. Check base path in workflow:

   ```yaml
   env:
     VITE_BASE_PATH: /kaiord/
   ```

2. Verify in index.html:

   ```bash
   grep 'src="' packages/workout-spa-editor/dist/index.html
   ```

3. Rebuild with correct base path:
   ```bash
   VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
   ```

#### Build Fails: "Cannot resolve @kaiord/core"

**Symptom:** SPA build fails with module resolution error

**Cause:** Core package not built before SPA build

**Solution:**

```bash
# Build core first
pnpm --filter @kaiord/core build

# Then build SPA
pnpm --filter @kaiord/workout-spa-editor build
```

### npm Publishing

#### npm Publish Fails with "403 Forbidden"

**Symptom:** Release workflow fails during package publishing

**Possible causes:**

- Invalid or expired `NPM_TOKEN`
- Trusted publishing not configured on npm
- Insufficient permissions on npm package

**Solution:**

For trusted publishing:

1. Go to npm package settings
2. Configure trusted publisher (see Trusted Publishing section)
3. Re-run the workflow

For token-based:

```bash
# Verify token locally
npm whoami --registry https://registry.npmjs.org

# Check package access
npm access list packages

# Regenerate token if needed
npm token create --type=automation
```

#### "Workflow failed: npm ERR! 401 Unauthorized"

**Symptom:** Workflow fails with 401 error

**Cause:** Missing `id-token: write` permission (trusted publishing)

**Solution:** Verify workflow has:

```yaml
permissions:
  id-token: write
```

### CI/CD Workflows

#### Tests Pass Locally but Fail in CI

**Symptom:** Tests succeed on your machine but fail in GitHub Actions

**Possible causes:**

- Environment differences (Node version, OS)
- Missing environment variables
- Timezone differences

**Solution:**

```bash
# Test with act (local GitHub Actions runner)
brew install act
act -j test

# Or match CI environment
docker run -it node:24-alpine sh
```

#### Workflow Stuck in "Queued" State

**Symptom:** Workflow doesn't start, remains queued indefinitely

**Possible causes:**

- GitHub Actions quota exceeded (for private repos)
- Too many concurrent workflows
- Runner availability issues

**Solution:**

- Check Actions usage: Settings → Billing → Actions
- Cancel unnecessary workflow runs
- Wait for runners to become available
- Check GitHub status: [githubstatus.com](https://www.githubstatus.com)

### Security Audit

#### Workflow Fails on Low/Moderate Vulnerabilities

**Symptom:** Security workflow fails even though vulnerabilities are low/moderate

**Solution:**

Review the audit configuration in `security.yml`:

```yaml
run: pnpm audit --audit-level=high
```

Update dependencies:

```bash
pnpm update
```

Check for available patches:

```bash
pnpm audit fix
```

## Best Practices

### Before Pushing to Main

1. **Test locally:**

   ```bash
   ./scripts/test-ci-workflows.sh
   ```

2. **Run tests:**

   ```bash
   pnpm -r test
   ```

3. **Check linting:**

   ```bash
   pnpm -r lint
   ```

4. **Verify build:**
   ```bash
   pnpm -r build
   ```

### During Development

1. **Use feature branches** - Don't push directly to `main`
2. **Test in PR** - Create PR to see CI checks before merging
3. **Review workflow logs** - Check Actions tab after merge
4. **Verify deployment** - Test live site/packages after deployment

### Monitoring

1. **Check deployment status** - After each push to `main`
2. **Test live site** - Verify functionality works correctly
3. **Monitor errors** - Check browser console for JavaScript errors
4. **Review logs** - Periodically review workflow logs for warnings

## Additional Resources

### Internal Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [Architecture](./architecture.md) - System architecture overview
- [Testing](./testing.md) - Testing guidelines
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines

### External Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## Getting Help

If you encounter issues not covered in this guide:

1. Check workflow logs in GitHub Actions tab
2. Search existing issues in the repository
3. Review GitHub Actions status page
4. Ask in repository discussions
5. Contact repository maintainers
