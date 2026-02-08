# NPM Publishing Recovery Guide

## Problem Summary

The GitHub Actions release workflow failed due to expired npm tokens. This left the packages in an inconsistent state:

- ✅ `@kaiord/core@1.0.0` - outdated (should be 4.0.0)
- ✅ `@kaiord/cli@4.1.0` - up to date
- ❌ `@kaiord/fit` - never published
- ❌ `@kaiord/tcx` - never published
- ❌ `@kaiord/zwo` - never published
- ❌ `@kaiord/garmin` - never published

## Step 1: Create npm Automation Token

**Use Automation Token** (recommended) - designed for CI/CD, never expires:

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click **"Generate New Token"** → **"Automation"**
3. Configure:
   - **Token Type**: Automation
   - **Description**: `kaiord-github-actions`
   - No expiration (automation tokens don't expire)

4. Copy the token (you'll only see it once!)

**Why Automation Token?**

- ✅ Never expires (no 90-day renewal)
- ✅ Designed for CI/CD
- ✅ Works with provenance
- ✅ Less maintenance

See `docs/npm-authentication.md` for detailed comparison of token types.

## Step 2: Update GitHub Secret

```bash
# Set the NPM_TOKEN secret
gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord
# Paste the token when prompted
```

## Step 3: Fix Local npm Authentication (Optional)

If you want to test publishing locally:

```bash
# Login to npm (not needed for CI)
npm login

# Or set token directly
echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN" > ~/.npmrc
```

## Step 4: Manual Recovery Publish

Since the packages are out of sync, you have two options:

### Option A: Automated Recovery (Recommended)

Wait for the current GitHub Actions workflow to complete or trigger it manually:

```bash
# Trigger the release workflow manually
gh workflow run release.yml
```

The workflow will:

1. Detect the pending changeset
2. Version packages according to linked configuration
3. Publish all packages that need updating

### Option B: Manual Publish (If workflow still fails)

If the automated workflow continues to fail:

```bash
# 1. Build all packages
pnpm -r build

# 2. Publish packages in dependency order
cd packages/core && pnpm publish --access public
cd ../fit && pnpm publish --access public
cd ../tcx && pnpm publish --access public
cd ../zwo && pnpm publish --access public
cd ../garmin && pnpm publish --access public
cd ../cli && pnpm publish --access public

# 3. Create git tags
git tag @kaiord/core@4.0.0
git tag @kaiord/fit@4.0.0
git tag @kaiord/tcx@4.0.0
git tag @kaiord/zwo@4.0.0
git tag @kaiord/garmin@1.0.0
git tag @kaiord/cli@4.1.0

# 4. Push tags
git push origin --tags

# 5. Remove consumed changesets
rm .changeset/add-garmin-format-support.md
git add .changeset
git commit -m "chore: consumed changesets [skip ci]"
git push
```

## Step 5: Verify Publishing

Check that all packages are published correctly:

```bash
npm view @kaiord/core version    # Should be 4.0.0
npm view @kaiord/fit version     # Should be 4.0.0
npm view @kaiord/tcx version     # Should be 4.0.0
npm view @kaiord/zwo version     # Should be 4.0.0
npm view @kaiord/garmin version  # Should be 1.0.0
npm view @kaiord/cli version     # Should be 4.1.0
```

## Step 6: Token Maintenance

**Automation tokens don't expire**, but good practices:

1. **Monitor**: Set up alerts for failed publish workflows
2. **Audit**: Periodically review token usage on npm
3. **Rotate**: Consider rotating tokens annually for security
4. **Backup**: Document token creation process for team members

**If using Granular tokens** (not recommended):

- Set reminder for renewal 7 days before expiration (90 days)
- See `docs/npm-authentication.md` for migration to Automation tokens

## Common Issues

### "ENEEDAUTH" Error

**Cause**: Token is expired or invalid.
**Solution**: Generate a new token (Step 1) and update GitHub secret (Step 2).

### "E403 Forbidden"

**Cause**: Token doesn't have write permissions for the package.
**Solution**:

- Check token has `Read and write` permission for `@kaiord/*`
- Verify you're a maintainer of the packages on npm

### "E404 Not Found"

**Cause**: Package doesn't exist yet on npm.
**Solution**: First publish requires the `--access public` flag (already in commands).

### Packages Out of Sync

**Cause**: Partial publish failure.
**Solution**: Follow Option B to manually publish missing packages.

## Preventing Future Issues

1. **Token Monitoring**:
   - Document token expiration date in team calendar
   - Set up monitoring to alert on publish failures

2. **Dry Run Testing**:

   ```bash
   # Test publish without actually publishing
   pnpm exec changeset publish --dry-run
   ```

3. **Branch Protection**:
   - Ensure release workflow completes before merging
   - Use required status checks

4. **Fallback Strategy**:
   - Keep manual publish instructions (Option B) accessible
   - Test manual publish flow periodically

## Workflow Architecture

The release process uses:

1. **Changesets**: Version management and changelog generation
2. **GitHub Actions**: Automated CI/CD pipeline
3. **Linked Packages**: All packages version together for consistency

When a changeset is merged to `main`:

1. Workflow detects changesets in `.changeset/*.md`
2. Runs `changeset version` to bump versions and generate CHANGELOGs
3. Builds all packages
4. Commits version changes
5. Publishes to npm
6. Creates GitHub releases
7. Pushes git tags

## Contact & Support

- GitHub Issues: https://github.com/pablo-albaladejo/kaiord/issues
- Changesets Docs: https://github.com/changesets/changesets
- npm Tokens Docs: https://docs.npmjs.com/about-access-tokens
