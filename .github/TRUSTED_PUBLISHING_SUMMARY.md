# 🎉 npm Trusted Publishing - The Better Way

## What Changed?

npm now shows a security warning when creating tokens for CI/CD:

> ⚠️ **"There are security risks with this option. For automation or CI/CD uses, please use Trusted Publishing instead."**

We've updated everything to support **Trusted Publishing** - the secure, modern way to publish packages.

---

## Why Trusted Publishing is Better

### 🔒 More Secure

- **No secrets to manage** - Uses OpenID Connect (OIDC)
- **No token theft risk** - Nothing to steal or leak
- **Cryptographic proof** - Verifiable package origin
- **Automatic verification** - npm validates with GitHub

### 🎯 Easier to Use

- **No token rotation** - Set it once, works forever
- **No expiration** - Never expires
- **No GitHub secrets** - Nothing to configure in GitHub
- **Automatic provenance** - Trust badge on npm

### ✅ Industry Standard

- **SLSA compliant** - Supply chain security framework
- **npm recommended** - Official best practice
- **GitHub native** - Built into GitHub Actions
- **Verifiable** - Users can verify package authenticity

---

## How to Set It Up

### Step 1: First Publish (Manual)

```bash
# Login to npm
npm login

# Build your package
pnpm -r build

# Publish manually
pnpm --filter @kaiord/core publish --access public
```

### Step 2: Configure Trusted Publishing

1. Go to your package on npm:
   https://www.npmjs.com/package/@kaiord/core

2. Click "Settings" tab

3. Scroll to "Publishing access"

4. Click "Configure trusted publishers"

5. Add GitHub Actions:
   - Provider: **GitHub Actions**
   - Repository owner: `pablo-albaladejo`
   - Repository name: `kaiord`
   - Workflow name: `release.yml`
   - Environment: (leave empty)

6. Click "Add"

### Step 3: Done!

That's it! Your workflow is already configured to use trusted publishing.

Next time you create a release, it will:

- ✅ Publish automatically
- ✅ No tokens needed
- ✅ Generate provenance attestation
- ✅ Show trust badge on npm

---

## What We Updated

### Workflow Changes

Added to `.github/workflows/release.yml`:

```yaml
permissions:
  id-token: write # Required for npm provenance

jobs:
  publish:
    steps:
      - run: pnpm publish --provenance # Enables trusted publishing
```

### Documentation

Created comprehensive guides:

1. **`.github/NPM_TRUSTED_PUBLISHING.md`** - Complete setup guide
2. **`QUICK_START_NPM.md`** - Updated with trusted publishing
3. **`.github/SETUP_CHECKLIST.md`** - Both options documented
4. **`.github/NPM_TOKEN_GUIDE.md`** - Token guide (for legacy/local use)

---

## Comparison

| Feature         | Trusted Publishing | Token-Based             |
| --------------- | ------------------ | ----------------------- |
| Security        | ✅ Highest         | ⚠️ Medium               |
| Setup           | ⚠️ One-time        | ⚠️ One-time             |
| Maintenance     | ✅ None            | ❌ Rotate every 90 days |
| Secrets         | ✅ None            | ❌ Need NPM_TOKEN       |
| Provenance      | ✅ Automatic       | ❌ No                   |
| Token theft     | ✅ Impossible      | ⚠️ Possible             |
| Expiration      | ✅ Never           | ❌ 90 days              |
| npm Recommended | ✅ Yes             | ❌ No                   |

---

## Migration Path

If you already have `NPM_TOKEN` configured:

### Option 1: Switch to Trusted Publishing (Recommended)

1. Publish current version (uses token)
2. Configure trusted publishing on npm
3. Test with new version (no token needed)
4. Remove `NPM_TOKEN` secret from GitHub

### Option 2: Keep Using Tokens

Tokens still work, but:

- ⚠️ npm shows security warning
- ⚠️ Need to rotate every 90 days
- ⚠️ No provenance attestation
- ⚠️ Not recommended by npm

---

## FAQ

### Do I need to do anything in GitHub?

**No!** The workflow is already configured. Just set up trusted publishing on npm.

### What about the NPM_TOKEN secret?

**Don't need it!** Trusted publishing doesn't use secrets.

If you already have it:

- It will work as fallback
- You can remove it after switching to trusted publishing

### Can I still publish manually?

**Yes!** Use `npm login` and publish normally. Trusted publishing only affects CI/CD.

### What if I have multiple packages?

Configure trusted publishing for each package:

- `@kaiord/core`
- `@kaiord/cli` (if it exists)

Same settings for all: `pablo-albaladejo/kaiord` + `release.yml`

### Does this work with private packages?

**Yes!** Trusted publishing works with both public and private packages.

---

## Verification

After setup, verify it's working:

### 1. Check Provenance Badge

Go to https://www.npmjs.com/package/@kaiord/core

Look for the "Provenance" badge next to the version.

### 2. View Attestation

```bash
npm view @kaiord/core --json | jq '.dist.attestations'
```

Should show:

```json
{
  "url": "https://registry.npmjs.org/-/npm/v1/attestations/@kaiord/core@0.1.1",
  "provenance": {
    "predicateType": "https://slsa.dev/provenance/v1"
  }
}
```

### 3. Test Workflow

```bash
# Create a changeset
pnpm exec changeset

# Commit and push
git add .changeset/
git commit -m "chore: test trusted publishing"
git push

# Merge "Version Packages" PR
# Watch workflow - should succeed without NPM_TOKEN
```

---

## Troubleshooting

### "403 Forbidden" when publishing

**Cause:** Trusted publishing not configured on npm

**Solution:** Follow Step 2 above to configure trusted publisher

### "401 Unauthorized" when publishing

**Cause:** Missing `id-token: write` permission

**Solution:** Already fixed in workflow - just re-run

### No provenance badge showing

**Cause:** Published without `--provenance` flag

**Solution:** Already fixed in workflow - next version will have it

---

## Resources

- **npm Provenance:** https://docs.npmjs.com/generating-provenance-statements
- **GitHub OIDC:** https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- **SLSA Framework:** https://slsa.dev/
- **npm Blog Post:** https://github.blog/2023-04-19-introducing-npm-package-provenance/

---

## Next Steps

1. **Publish manually once** (if not already published)
2. **Configure trusted publishing** on npm
3. **Test with new version**
4. **Remove NPM_TOKEN** (if exists)
5. **Enjoy automatic, secure publishing!** 🎉

---

**Questions?** See `.github/NPM_TRUSTED_PUBLISHING.md` for complete guide.
