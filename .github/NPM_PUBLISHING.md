# npm Publishing Guide

This document explains how to publish packages to npm using the automated CI/CD pipeline.

## Prerequisites

### 1. npm Account Setup

1. Create an account at https://www.npmjs.com/
2. Verify your email address
3. (Optional) Enable 2FA for additional security

### 2. Generate npm Token

1. Go to https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens
2. Click "Generate New Token"
3. Select **"Automation"** token type
4. Copy the token (it will only be shown once)

### 3. Configure GitHub Secret

1. Go to https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: [paste your npm token]
5. Click "Add secret"

## Publishing Workflow

### Automated Publishing (Recommended)

The project uses [Changesets](https://github.com/changesets/changesets) for version management and automated publishing.

#### Step 1: Create a Changeset

When you make changes that should be published:

```bash
# Create a changeset
pnpm exec changeset
```

Answer the prompts:
- **Which packages changed?** Select the packages you modified
- **What type of change?** Choose:
  - `patch` (0.1.1 → 0.1.2) - Bug fixes
  - `minor` (0.1.1 → 0.2.0) - New features (backward compatible)
  - `major` (0.1.1 → 1.0.0) - Breaking changes
- **Summary:** Describe the changes

#### Step 2: Commit and Push

```bash
git add .changeset/
git commit -m "chore: add changeset for [feature/fix]"
git push origin main
```

#### Step 3: Review Version Packages PR

1. The Changesets workflow will automatically create a PR titled "chore: version packages"
2. Review the PR to verify:
   - Version bumps are correct
   - CHANGELOG.md entries are accurate
   - All changes are included

#### Step 4: Merge to Publish

1. Merge the "Version Packages" PR
2. The workflow will automatically:
   - Create a GitHub Release with the new version
   - Trigger the Release workflow
   - Build all packages
   - Publish changed packages to npm

#### Step 5: Verify Publication

```bash
# Check the published version
npm view @kaiord/core version

# Install the package
npm install @kaiord/core
```

### Manual Publishing (Emergency Only)

If the automated workflow fails, you can publish manually:

```bash
# 1. Login to npm
npm login

# 2. Build packages
pnpm -r build

# 3. Publish (from workspace root)
pnpm --filter @kaiord/core publish --access public

# 4. Verify
npm view @kaiord/core
```

## Workflow Details

### Release Workflow (`.github/workflows/release.yml`)

Triggered when a GitHub Release is published.

**Features:**
- Builds all packages with production optimizations
- Detects packages with version changes
- Publishes only changed packages
- Retry logic with exponential backoff (3 attempts)
- Creates GitHub issue on failure
- Notifies maintainers on errors

**Environment Variables:**
- `NODE_AUTH_TOKEN`: Set from `secrets.NPM_TOKEN`

### Changesets Workflow (`.github/workflows/changesets.yml`)

Triggered on push to `main` branch.

**Features:**
- Creates/updates "Version Packages" PR
- Bumps versions according to changesets
- Generates CHANGELOG.md entries
- Creates GitHub Release when PR is merged

## Troubleshooting

### Publishing Fails with "401 Unauthorized"

**Cause:** Invalid or expired npm token

**Solution:**
1. Generate a new npm token
2. Update the `NPM_TOKEN` secret in GitHub
3. Re-run the failed workflow

### Publishing Fails with "403 Forbidden"

**Cause:** Token lacks publish permissions or package name is taken

**Solution:**
1. Verify token type is "Automation"
2. Check package name is available on npm
3. Verify you have publish permissions for the `@kaiord` scope

### Version Already Published

**Cause:** Trying to publish a version that already exists

**Solution:**
1. Bump the version in `package.json`
2. Create a new changeset
3. Follow the normal publishing workflow

### Build Fails Before Publishing

**Cause:** TypeScript errors or test failures

**Solution:**
1. Fix the errors locally
2. Run `pnpm -r build` and `pnpm -r test`
3. Commit and push fixes
4. Re-run the workflow

## Package Configuration

### Required Fields in `package.json`

```json
{
  "name": "@kaiord/core",
  "version": "0.1.1",
  "description": "Core library for Kaiord workout data conversion",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "schema"
  ]
}
```

### Files Included in Package

Only files listed in the `files` array are published:
- `dist/` - Compiled JavaScript and TypeScript declarations
- `schema/` - JSON schemas for validation

## Best Practices

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Patch (0.1.1 → 0.1.2):** Bug fixes, no API changes
- **Minor (0.1.1 → 0.2.0):** New features, backward compatible
- **Major (0.1.1 → 1.0.0):** Breaking changes

### Changelog Guidelines

Write clear, user-focused changelog entries:

```markdown
## 0.2.0

### Features

- Add support for swimming equipment in workout steps
- Implement power-based duration types

### Bug Fixes

- Fix incorrect power target encoding for FTP percentages

### Breaking Changes

- Remove deprecated `toJSON()` method (use `toKRD()` instead)
```

### Pre-Release Checklist

Before creating a changeset:

- [ ] All tests pass (`pnpm -r test`)
- [ ] Build succeeds (`pnpm -r build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] CHANGELOG entry is clear and accurate

## Monitoring

### Check Workflow Status

- CI/CD workflows: https://github.com/pablo-albaladejo/kaiord/actions
- Latest release: https://github.com/pablo-albaladejo/kaiord/releases

### npm Package Status

- Package page: https://www.npmjs.com/package/@kaiord/core
- Download stats: https://npm-stat.com/charts.html?package=@kaiord/core

### Badges

The README includes badges that update automatically:

- **CI Status:** Shows if tests are passing
- **Coverage:** Shows test coverage percentage
- **npm Version:** Shows latest published version

## Security

### Token Security

- **Never commit** npm tokens to the repository
- **Rotate tokens** every 90 days
- **Use Automation tokens** for CI/CD (not Publish tokens)
- **Enable 2FA** on your npm account

### Package Security

- Run `pnpm audit` regularly to check for vulnerabilities
- Review dependency updates from Dependabot
- Keep dependencies up to date

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review workflow logs in GitHub Actions
3. Check npm registry status: https://status.npmjs.org/
4. Create an issue: https://github.com/pablo-albaladejo/kaiord/issues

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
