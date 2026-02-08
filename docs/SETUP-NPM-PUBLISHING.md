# ✅ npm Publishing Setup Checklist

Quick checklist to enable automatic npm publishing with Trusted Publishing (no tokens needed).

## Prerequisites

- [ ] You are a maintainer of all `@kaiord/*` packages on npm
- [ ] You have access to npm.com package settings

## Setup Steps (15 minutes)

### 1. Configure Trusted Publishers on npm.com ⏱️ 10 min

**For EACH package**, go to the package's npm page and configure:

#### @kaiord/core

- [ ] Go to: https://www.npmjs.com/package/@kaiord/core/access
- [ ] Click "Configure Trusted Publishers" → "Add Trusted Publisher" → "GitHub Actions"
- [ ] Fill in:
  - Repository owner: `pablo-albaladejo`
  - Repository name: `kaiord`
  - Workflow name: `Release`
  - Environment: (leave empty)
- [ ] Click "Add"

#### @kaiord/fit

- [ ] Go to: https://www.npmjs.com/package/@kaiord/fit/access
- [ ] Add Trusted Publisher (same settings as above)

#### @kaiord/tcx

- [ ] Go to: https://www.npmjs.com/package/@kaiord/tcx/access
- [ ] Add Trusted Publisher (same settings as above)

#### @kaiord/zwo

- [ ] Go to: https://www.npmjs.com/package/@kaiord/zwo/access
- [ ] Add Trusted Publisher (same settings as above)

#### @kaiord/garmin

- [ ] Go to: https://www.npmjs.com/package/@kaiord/garmin/access
- [ ] Add Trusted Publisher (same settings as above)

#### @kaiord/cli

- [ ] Go to: https://www.npmjs.com/package/@kaiord/cli/access
- [ ] Add Trusted Publisher (same settings as above)

### 2. Test the Configuration ⏱️ 5 min

```bash
# Create a test changeset
pnpm exec changeset
# Select @kaiord/core, choose "patch", write "test: verify trusted publishing"

# Commit and push
git add .changeset/*.md
git commit -m "test: verify npm trusted publishing"
git push

# Watch the workflow
gh run watch
```

### 3. Verify Success ✅

After workflow completes:

```bash
# Check new version was published
npm view @kaiord/core version

# Visit npm to see provenance badge
open https://www.npmjs.com/package/@kaiord/core
# Look for green "Provenance" badge with checkmark ✓
```

## What the Workflow Does (Automatic)

When you push a changeset:

1. ✅ **Version bump**: Changes `package.json` versions
2. ✅ **Update CHANGELOG**: Generates changelog from changesets
3. ✅ **Commit**: `chore: version packages [skip ci]`
4. ✅ **Publish to npm**: Uses OIDC (no token needed!)
5. ✅ **Create GitHub Release**: Tags and releases
6. ✅ **Add Provenance**: Cryptographic proof of origin

## Troubleshooting

### Workflow fails with "ENEEDAUTH"

**Problem:** Trusted Publisher not configured on npm.com

**Fix:**

1. Complete Step 1 for the failing package
2. Verify workflow name is exactly `Release`
3. Wait 2-3 minutes for npm to propagate
4. Re-run workflow

### Package has no provenance badge

**Problem:** Missing `id-token: write` or `NPM_CONFIG_PROVENANCE`

**Fix:** Already configured in your workflow ✅

### Workflow doesn't trigger

**Problem:** No changesets or wrong paths

**Fix:**

1. Create a changeset: `pnpm exec changeset`
2. Verify `.changeset/*.md` files exist
3. Or trigger manually: `gh workflow run release.yml`

## Important Notes

- **No tokens needed**: Once Trusted Publishers are configured, no `NPM_TOKEN` secret is required
- **Secure**: Uses short-lived OIDC tokens (expire in minutes)
- **Provenance**: Automatic supply chain security
- **Set and forget**: No 90-day renewal like token-based publishing

## Next Steps After Setup

### Regular Workflow

```bash
# 1. Make changes to code
# 2. Create changeset
pnpm exec changeset

# 3. Commit and push
git add .
git commit -m "feat: your feature"
git push

# 4. Workflow publishes automatically! 🎉
```

### Monitoring

```bash
# Check latest workflow runs
gh run list --workflow=release.yml --limit 5

# View specific run
gh run view RUN_ID

# Check published versions
npm view @kaiord/core version
npm view @kaiord/cli version
```

## Resources

- **Detailed Guide**: [docs/npm-trusted-publishing.md](./npm-trusted-publishing.md)
- **npm Trusted Publishers Docs**: https://docs.npmjs.com/generating-provenance-statements
- **GitHub OIDC Docs**: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-npm

---

**Status**: ⏳ Waiting for Trusted Publishers to be configured on npm.com

Once Step 1 is complete, publishing will work automatically with zero token management! 🚀
