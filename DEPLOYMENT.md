# Deployment Guide

This document provides comprehensive information about deploying the Kaiord Workout SPA Editor to GitHub Pages.

## Table of Contents

- [Overview](#overview)
- [Automated Deployment](#automated-deployment)
- [Manual Deployment](#manual-deployment)
- [Local Testing](#local-testing)
- [Troubleshooting](#troubleshooting)
- [Configuration](#configuration)

## Overview

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
- [.kiro/specs/deployment/fix-spa-deployment/](./. kiro/specs/deployment/fix-spa-deployment/) - Deployment spec
