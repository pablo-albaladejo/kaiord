# 🔒 npm Trusted Publishing Setup Guide

## What is Trusted Publishing?

**Trusted Publishing** (also called "provenance") is npm's recommended way to publish packages from CI/CD. It's more secure than using tokens because:

- ✅ **No secrets needed** - Uses OpenID Connect (OIDC) for authentication
- ✅ **Automatic verification** - npm verifies the package came from your GitHub repository
- ✅ **Provenance attestation** - Cryptographic proof of package origin
- ✅ **No token rotation** - No tokens to expire or manage
- ✅ **Better security** - Eliminates token theft risk

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow                                     │
│                                                              │
│  1. Workflow runs with id-token: write permission          │
│  2. GitHub generates OIDC token automatically               │
│  3. npm verifies token with GitHub                          │
│  4. npm allows publish if verification succeeds             │
│  5. npm generates provenance attestation                    │
└─────────────────────────────────────────────────────────────┘
```

## Setup Steps

### Step 1: Configure npm Package

Add your GitHub repository to `package.json`:

```json
{
  "name": "@kaiord/core",
  "version": "0.1.1",
  "repository": {
    "type": "git",
    "url": "https://github.com/pablo-albaladejo/kaiord.git"
  }
}
```

✅ **Already done** - Your package.json already has this!

---

### Step 2: Enable Trusted Publishing on npm

1. **Go to your package settings on npm:**
   - First publish: https://www.npmjs.com/package/@kaiord/core
   - Or go to: https://www.npmjs.com/settings/pablo-albaladejo/packages

2. **Click on your package** (`@kaiord/core`)

3. **Go to "Settings" tab**

4. **Scroll to "Publishing access"**

5. **Click "Configure trusted publishers"**

6. **Add GitHub Actions as trusted publisher:**
   - Provider: **GitHub Actions**
   - Repository owner: `pablo-albaladejo`
   - Repository name: `kaiord`
   - Workflow name: `release.yml` (or leave empty for any workflow)
   - Environment: (leave empty)

7. **Click "Add"**

8. **Repeat for any other packages** (e.g., `@kaiord/cli` if it exists)

---

### Step 3: Update GitHub Workflow

✅ **Already done!** The workflow has been updated with:

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

---

### Step 4: First Publish (Bootstrap)

**Important:** For the first publish, you need to use a token. After that, trusted publishing works automatically.

**Option A: Manual first publish (Recommended)**

```bash
# 1. Login to npm
npm login

# 2. Build package
pnpm -r build

# 3. Publish manually
pnpm --filter @kaiord/core publish --access public

# 4. Now configure trusted publishing on npm (Step 2 above)
```

**Option B: Use token for first publish**

1. Create a granular access token (see `.github/NPM_TOKEN_GUIDE.md`)
2. Add as GitHub secret `NPM_TOKEN`
3. First release will use token
4. After first publish, configure trusted publishing
5. Remove `NPM_TOKEN` secret (no longer needed)

---

## Verification

### Check if Trusted Publishing is Enabled

1. Go to https://www.npmjs.com/package/@kaiord/core
2. Look for the "Provenance" badge
3. Click on it to see the attestation details

### Verify Provenance

```bash
# View provenance for a published package
npm view @kaiord/core --json | jq '.dist.attestations'
```

You should see something like:

```json
{
  "url": "https://registry.npmjs.org/-/npm/v1/attestations/@kaiord/core@0.1.1",
  "provenance": {
    "predicateType": "https://slsa.dev/provenance/v1"
  }
}
```

---

## Troubleshooting

### "Package not found" when configuring trusted publisher

**Cause:** Package hasn't been published yet

**Solution:** Publish the package manually first (see Step 4 above)

---

### "Workflow failed: npm ERR! 403 Forbidden"

**Cause:** Trusted publishing not configured on npm

**Solution:**

1. Go to npm package settings
2. Configure trusted publisher (Step 2 above)
3. Re-run the workflow

---

### "Workflow failed: npm ERR! 401 Unauthorized"

**Cause:** Missing `id-token: write` permission

**Solution:** Verify workflow has:

```yaml
permissions:
  id-token: write
```

---

### "Provenance badge not showing"

**Cause:** Package published without `--provenance` flag

**Solution:**

1. Verify workflow uses `--provenance` flag
2. Publish a new version
3. Badge will appear on new version

---

## Migration from Token-Based Publishing

If you're currently using `NPM_TOKEN`:

### Step 1: Publish Current Version with Token

```bash
# Make sure current version is published
npm view @kaiord/core version
```

### Step 2: Configure Trusted Publishing

Follow Step 2 above to add GitHub Actions as trusted publisher

### Step 3: Test with New Version

```bash
# Create a patch version
pnpm exec changeset
# Select patch, describe as "test trusted publishing"

# Commit and push
git add .changeset/
git commit -m "chore: test trusted publishing"
git push

# Merge "Version Packages" PR
# Watch workflow - should succeed without NPM_TOKEN
```

### Step 4: Remove NPM_TOKEN Secret

Once verified working:

```bash
# Remove the secret
gh secret remove NPM_TOKEN --repo pablo-albaladejo/kaiord
```

Or via GitHub UI:

1. Go to https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions
2. Find `NPM_TOKEN`
3. Click "Remove"

---

## Benefits of Trusted Publishing

### Security

- ✅ No secrets to steal or leak
- ✅ Cryptographic proof of origin
- ✅ Automatic verification by npm
- ✅ Audit trail in npm registry

### Maintenance

- ✅ No token rotation needed
- ✅ No expiration to worry about
- ✅ One-time setup
- ✅ Works across all packages in repo

### Trust

- ✅ Users can verify package authenticity
- ✅ Provenance badge on npm
- ✅ SLSA compliance
- ✅ Supply chain security

---

## Comparison: Trusted Publishing vs Tokens

| Feature          | Trusted Publishing | Granular Token          | Classic Token       |
| ---------------- | ------------------ | ----------------------- | ------------------- |
| Security         | ✅ Highest         | ⚠️ Medium               | ❌ Low              |
| Setup complexity | ⚠️ Medium          | ⚠️ Medium               | ✅ Easy             |
| Maintenance      | ✅ None            | ⚠️ Rotate every 90 days | ⚠️ Rotate regularly |
| Provenance       | ✅ Automatic       | ❌ No                   | ❌ No               |
| Token theft risk | ✅ None            | ⚠️ Possible             | ⚠️ High             |
| Recommended      | ✅ Yes             | ⚠️ Fallback             | ❌ Deprecated       |

---

## Advanced Configuration

### Restrict to Specific Workflow

For extra security, specify the exact workflow:

```
Workflow name: release.yml
```

This ensures only the release workflow can publish.

### Restrict to Specific Environment

If using GitHub environments:

```
Environment: production
```

This requires manual approval before publishing.

### Multiple Repositories

If you have multiple repos publishing the same package:

1. Add each repo as a trusted publisher
2. Each repo can publish independently
3. All will have provenance attestation

---

## FAQ

### Do I still need NPM_TOKEN?

**No!** Once trusted publishing is configured, you don't need `NPM_TOKEN` at all.

### Can I use both trusted publishing and tokens?

**Yes**, but it's not recommended. Choose one method:

- Trusted publishing for CI/CD (recommended)
- Tokens for local/manual publishing (if needed)

### What if GitHub Actions is down?

You can still publish manually with:

```bash
npm login
pnpm --filter @kaiord/core publish --access public
```

### Does this work with other CI/CD providers?

Currently, npm trusted publishing supports:

- ✅ GitHub Actions
- ✅ GitLab CI
- ⚠️ Other providers: Use tokens

### Can I verify provenance of any package?

Yes! For any package with provenance:

```bash
npm view <package-name> --json | jq '.dist.attestations'
```

---

## Resources

- **npm Provenance Documentation:** https://docs.npmjs.com/generating-provenance-statements
- **GitHub OIDC Documentation:** https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- **SLSA Framework:** https://slsa.dev/
- **npm Trusted Publishers:** https://github.blog/2023-04-19-introducing-npm-package-provenance/

---

## Quick Reference

### Enable Trusted Publishing

1. Publish package manually first
2. Go to npm package settings
3. Add GitHub Actions as trusted publisher
4. Configure: `pablo-albaladejo/kaiord` + `release.yml`
5. Done! No tokens needed

### Verify It's Working

```bash
# Check provenance
npm view @kaiord/core --json | jq '.dist.attestations'

# Should see provenance URL and SLSA predicate
```

### Troubleshoot

- 403 Forbidden → Configure trusted publisher on npm
- 401 Unauthorized → Add `id-token: write` permission
- No provenance badge → Add `--provenance` flag

---

**Next Steps:**

1. Publish `@kaiord/core` manually (if not already published)
2. Configure trusted publishing on npm
3. Test with a new version
4. Remove `NPM_TOKEN` secret (if exists)

**Need help?** See `.github/SETUP_CHECKLIST.md` or create an issue.
