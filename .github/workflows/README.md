# GitHub Actions CI/CD Workflows

This directory contains the CI/CD workflows for the Kaiord monorepo. These workflows automate testing, security scanning, version management, and package publishing.

## Workflow Overview

### 1. CI Workflow (`ci.yml`)

**Purpose:** Validates code quality, runs tests, and generates coverage reports on every pull request and push to main.

**Triggers:**

- Pull requests (opened, synchronize, reopened)
- Push to `main` branch

**Jobs:**

- `detect-changes`: Analyzes git diff to determine which packages need testing
- `lint`: Runs ESLint and Prettier checks
- `typecheck`: Verifies TypeScript types compile without errors
- `test`: Runs tests with coverage for affected packages
- `build`: Verifies packages build successfully

**Key Features:**

- Intelligent change detection (only tests affected packages)
- Multi-version testing (Node.js 20.x, 22.x)
- Coverage reporting with Codecov
- Parallel job execution for speed

### 2. Security Audit Workflow (`security.yml`)

**Purpose:** Scans dependencies for security vulnerabilities.

**Triggers:**

- Weekly schedule (Mondays at 9:00 AM UTC)
- Pull requests that modify `package.json` or `pnpm-lock.yaml`
- Manual dispatch

**Jobs:**

- `audit`: Runs npm audit and reports vulnerabilities
- Creates GitHub issues for high/critical vulnerabilities
- Comments on PRs with vulnerability summaries

### 3. Changesets Workflow (`changesets.yml`)

**Purpose:** Automates version bumping and changelog generation.

**Triggers:**

- Push to `main` branch

**Jobs:**

- `version`: Creates or updates "Version Packages" PR
- Generates changelogs based on changeset files
- Triggers release workflow when PR is merged

### 4. Release Workflow (`release.yml`)

**Purpose:** Builds and publishes packages to npm when a release is created.

**Triggers:**

- Release published event

**Jobs:**

- `publish`: Builds packages and publishes to npm registry
- Creates GitHub deployment
- Updates README badges

## Workflow Architecture

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

## Using Changesets for Version Management

Changesets is a tool that helps manage versioning and changelogs in monorepos. Here's how to use it:

### Adding a Changeset

When you make changes that should be included in the next release, add a changeset:

```bash
pnpm exec changeset
```

This will prompt you to:

1. Select which packages have changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

The command creates a markdown file in `.changeset/` with your changes.

### Changeset Types

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

### Example Changeset

```markdown
---
"@kaiord/core": minor
"@kaiord/cli": patch
---

Add support for TCX format conversion. The CLI now accepts TCX files as input.
```

### Changeset Workflow

1. **Create feature branch:** `git checkout -b feature/tcx-support`
2. **Make changes:** Implement your feature
3. **Add changeset:** `pnpm exec changeset`
4. **Commit:** `git commit -am "feat: add TCX support"`
5. **Push and create PR:** `git push origin feature/tcx-support`
6. **Merge to main:** After PR approval
7. **Automatic PR creation:** Changesets workflow creates "Version Packages" PR
8. **Review and merge:** Review the version bumps and changelogs
9. **Automatic release:** Release workflow publishes to npm

## Triggering Manual Workflows

Some workflows can be triggered manually using GitHub's workflow dispatch feature.

### Security Audit

To run a security audit manually:

1. Go to **Actions** tab in GitHub
2. Select **Security Audit** workflow
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow**

### Using GitHub CLI

You can also trigger workflows using the GitHub CLI:

```bash
# Trigger security audit
gh workflow run security.yml

# Trigger with specific branch
gh workflow run security.yml --ref main
```

## Required Secrets

The workflows require the following secrets to be configured in your repository settings.

### NPM_TOKEN

**Purpose:** Authenticates with npm registry for publishing packages.

**Setup Instructions:**

1. **Create npm token:**
   ```bash
   npm login
   npm token create --type=automation
   ```
2. **Add to GitHub:**
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: Paste the token from step 1
   - Click **Add secret**

3. **Token requirements:**
   - Type: Automation token (recommended)
   - Scope: Publish access to `@kaiord/*` packages
   - Expiration: Set according to your security policy (90 days recommended)

4. **Token rotation:**
   - Create new token before expiration
   - Update GitHub secret
   - Revoke old token

### CODECOV_TOKEN (Optional)

**Purpose:** Uploads coverage reports to Codecov.

**Setup Instructions:**

1. **Get token from Codecov:**
   - Sign up at [codecov.io](https://codecov.io)
   - Add your repository
   - Copy the upload token

2. **Add to GitHub:**
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: Paste the token from Codecov
   - Click **Add secret**

**Note:** For public repositories, Codecov token is optional. For private repositories, it's required.

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. CI Workflow Fails with "pnpm: command not found"

**Symptom:** Workflow fails during dependency installation.

**Solution:**

- Ensure `pnpm/action-setup@v2` is used before `actions/setup-node@v4`
- Check that `packageManager` field in `package.json` specifies pnpm version

```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 9
- uses: actions/setup-node@v4
  with:
    node-version: 20.x
    cache: "pnpm"
```

#### 2. Tests Pass Locally but Fail in CI

**Symptom:** Tests succeed on your machine but fail in GitHub Actions.

**Possible causes:**

- Environment differences (Node version, OS)
- Missing environment variables
- Timezone differences
- File system case sensitivity

**Solution:**

```bash
# Test with act (local GitHub Actions runner)
brew install act
act -j test

# Or use Docker to match CI environment
docker run -it node:20-alpine sh
```

#### 3. Coverage Upload Fails

**Symptom:** Codecov upload step fails or times out.

**Solution:**

- Check if `CODECOV_TOKEN` is set (required for private repos)
- Verify coverage files are generated: `ls -la coverage/`
- Check Codecov status: [status.codecov.io](https://status.codecov.io)
- Retry the workflow (transient network issues)

#### 4. npm Publish Fails with "403 Forbidden"

**Symptom:** Release workflow fails during package publishing.

**Possible causes:**

- Invalid or expired `NPM_TOKEN`
- Insufficient permissions on npm package
- Package name already taken
- npm registry is down

**Solution:**

```bash
# Verify token locally
npm whoami --registry https://registry.npmjs.org

# Check package access
npm access list packages

# Regenerate token if needed
npm token create --type=automation
```

Update the `NPM_TOKEN` secret in GitHub with the new token.

#### 5. Changesets PR Not Created

**Symptom:** Merging changeset files doesn't create "Version Packages" PR.

**Possible causes:**

- No changeset files in `.changeset/` directory
- Workflow permissions insufficient
- Branch protection rules blocking bot

**Solution:**

- Verify changeset files exist: `ls -la .changeset/`
- Check workflow permissions in `changesets.yml`:
  ```yaml
  permissions:
    contents: write
    pull-requests: write
  ```
- Ensure bot has write access to repository

#### 6. Build Fails with "Out of Memory"

**Symptom:** Build or test job fails with heap out of memory error.

**Solution:**

```yaml
# Increase Node.js memory limit
- name: Build packages
  run: NODE_OPTIONS="--max-old-space-size=4096" pnpm -r build

# Or split builds
- name: Build core
  run: pnpm --filter @kaiord/core build
- name: Build cli
  run: pnpm --filter @kaiord/cli build
```

#### 7. Cache Not Working

**Symptom:** Dependencies are reinstalled on every run despite caching.

**Solution:**

- Verify cache key includes `pnpm-lock.yaml` hash
- Check cache size (GitHub has 10GB limit per repo)
- Clear cache manually if corrupted:
  - Go to **Actions** → **Caches**
  - Delete old caches

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      pnpm-${{ runner.os }}-
```

#### 8. Workflow Stuck in "Queued" State

**Symptom:** Workflow doesn't start, remains queued indefinitely.

**Possible causes:**

- GitHub Actions quota exceeded (for private repos)
- Too many concurrent workflows
- Runner availability issues

**Solution:**

- Check Actions usage: **Settings** → **Billing** → **Actions**
- Cancel unnecessary workflow runs
- Wait for runners to become available
- Check GitHub status: [githubstatus.com](https://www.githubstatus.com)

#### 9. Security Audit Fails on Low/Moderate Vulnerabilities

**Symptom:** Security workflow fails even though vulnerabilities are low/moderate.

**Solution:**

- Review the audit configuration in `security.yml`
- Adjust `--audit-level` if needed:
  ```yaml
  run: pnpm audit --audit-level=high
  ```
- Update dependencies: `pnpm update`
- Check for available patches: `pnpm audit fix`

#### 10. Matrix Job Fails for Specific Node Version

**Symptom:** Tests pass on Node 20.x but fail on Node 22.x.

**Solution:**

- Check for Node version-specific APIs
- Review deprecation warnings
- Update dependencies to support newer Node versions
- Add version-specific conditions:
  ```yaml
  - name: Run tests
    if: matrix.node-version == '20.x'
    run: pnpm test
  ```

## Performance Optimization Tips

### 1. Cache Strategy

Optimize caching to reduce workflow duration:

```yaml
# Cache pnpm store
- uses: pnpm/action-setup@v2
  with:
    version: 8

- uses: actions/setup-node@v4
  with:
    node-version: 20.x
    cache: "pnpm" # Automatic caching

# Additional caches
- uses: actions/cache@v3
  with:
    path: |
      ~/.pnpm-store
      **/node_modules
    key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
```

### 2. Parallel Execution

Run independent jobs in parallel:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    # Runs in parallel with typecheck and test

  typecheck:
    runs-on: ubuntu-latest
    # Runs in parallel with lint and test

  test:
    runs-on: ubuntu-latest
    # Runs in parallel with lint and typecheck
```

### 3. Conditional Execution

Skip unnecessary jobs based on changes:

```yaml
- name: Run tests
  if: needs.detect-changes.outputs.should-test == 'true'
  run: pnpm test
```

### 4. Matrix Optimization

Use matrix strategy efficiently:

```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]
    package: [core, cli]
  fail-fast: false # Continue other jobs if one fails
```

## Monitoring and Alerts

### Workflow Status

Monitor workflow health:

1. **Actions Dashboard:** View all workflow runs
2. **Status Badges:** Add to README for visibility
3. **Email Notifications:** Configure in GitHub settings
4. **Slack Integration:** Use GitHub Actions app

### Metrics to Track

- **Workflow duration:** Target < 5 minutes for full suite
- **Success rate:** Aim for > 95%
- **Cache hit rate:** Should be > 80%
- **Coverage trends:** Monitor over time

## Best Practices

### 1. Keep Workflows Fast

- Use caching aggressively
- Run jobs in parallel when possible
- Skip unnecessary steps with conditionals
- Use matrix strategy for multi-version testing

### 2. Fail Fast

- Set `fail-fast: true` in matrix strategy for critical jobs
- Use `continue-on-error: false` for important steps
- Validate early (lint before tests)

### 3. Security

- Never log secrets or tokens
- Use `secrets.GITHUB_TOKEN` for GitHub API calls
- Rotate tokens regularly
- Use least-privilege permissions

### 4. Maintainability

- Document workflow changes in commit messages
- Keep workflows under 300 lines
- Extract complex logic to scripts
- Use reusable workflows for common patterns

### 5. Testing

- Test workflows locally with `act`
- Use feature branches for workflow changes
- Monitor workflow runs after changes
- Keep backup of working workflows

## Additional Resources

### Internal Documentation

- **[Setup Checklist](../SETUP_CHECKLIST.md)** - Complete setup guide for CI/CD configuration
- **[npm Publishing Guide](../NPM_PUBLISHING.md)** - Detailed guide for publishing packages to npm
- **[Testing Workflows Locally](../TESTING_WORKFLOWS.md)** - Guide for testing workflows with `act`

### External Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm CI Guide](https://pnpm.io/continuous-integration)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Codecov Documentation](https://docs.codecov.com/)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)

## Getting Help

If you encounter issues not covered in this guide:

1. Check workflow logs in GitHub Actions tab
2. Search existing issues in the repository
3. Review GitHub Actions status page
4. Ask in repository discussions
5. Contact repository maintainers

## Workflow Maintenance

### Regular Tasks

- **Weekly:** Review security audit results
- **Monthly:** Check for workflow updates and deprecations
- **Quarterly:** Rotate npm tokens
- **Annually:** Review and optimize workflow performance

### Updating Workflows

When updating workflows:

1. Create feature branch
2. Test changes thoroughly
3. Document changes in PR description
4. Monitor first few runs after merge
5. Rollback if issues occur

### Deprecation Notices

Stay informed about GitHub Actions deprecations:

- Subscribe to [GitHub Changelog](https://github.blog/changelog/)
- Monitor workflow warnings
- Update actions to latest versions
- Test before major version upgrades
