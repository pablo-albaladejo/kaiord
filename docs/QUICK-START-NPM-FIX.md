# Quick Start: Fix npm Publishing

## 🎯 The Simple Solution

Your npm publishing is failing because you need an **npm Automation Token**. Here's the 2-minute fix:

### 1. Create Automation Token (1 min)

Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens

1. Click **"Generate New Token"** → **"Automation"**
2. Name: `kaiord-github-actions`
3. Copy the token

**Why Automation Token?**

- ✅ **Never expires** (no 90-day renewal hassle)
- ✅ Designed for CI/CD
- ✅ Works with provenance (supply chain security)

### 2. Set GitHub Secret (30 sec)

```bash
gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord
# Paste your token when prompted
```

### 3. Done! ✅

The workflow is already configured with provenance. Next push to main will publish automatically.

Or trigger manually:

```bash
gh workflow run release.yml
```

## 📊 What Gets Published

After the fix, these packages will publish:

- `@kaiord/core@4.0.0` (currently 1.0.0 on npm)
- `@kaiord/fit@4.0.0` (new package)
- `@kaiord/tcx@4.0.0` (new package)
- `@kaiord/zwo@4.0.0` (new package)
- `@kaiord/garmin@1.0.0` (new package - from pending changeset)
- `@kaiord/cli@4.1.0` (already published)

## 🔍 What Changed in Workflow

I updated `.github/workflows/release.yml`:

```yaml
- name: Publish to npm with provenance # ← Updated
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    NPM_CONFIG_PROVENANCE: true # ← Added provenance
  run: pnpm exec changeset publish
```

**Provenance** adds cryptographic proof showing where and how your packages were built. It's like a digital signature for supply chain security.

## 📚 Detailed Docs

- **`docs/npm-authentication.md`**: Complete guide to token types and provenance
- **`docs/npm-publish-recovery.md`**: Recovery guide with troubleshooting
- **`scripts/npm-publish-manual.sh`**: Manual publish script (if needed)

## ❓ FAQ

**Q: What if I already created a Granular token?**
A: It works but expires in 90 days. Create an Automation token instead (no expiration).

**Q: Do I need to do anything else?**
A: No! Just set the token and the workflow handles everything.

**Q: What about the expired token error?**
A: Fixed once you set the new NPM_TOKEN secret.

**Q: Will this happen again?**
A: No! Automation tokens don't expire (unless manually revoked).

**Q: What's provenance?**
A: Security feature that proves your package came from your GitHub repo. Users can verify authenticity.

## 🚨 Alternative: Manual Publish

If you need to publish immediately before fixing GitHub Actions:

```bash
# 1. Login to npm
npm login

# 2. Run manual publish script
./scripts/npm-publish-manual.sh
```

This publishes all packages and creates git tags manually.

## ✅ Verify It Worked

After publishing:

```bash
# Check versions on npm
npm view @kaiord/core version     # Should be 4.0.0
npm view @kaiord/garmin version   # Should be 1.0.0

# Check for provenance badge
# Visit: https://www.npmjs.com/package/@kaiord/core
# Look for "Provenance" badge
```

## Summary

1. Create Automation Token → 1 minute
2. Set GitHub Secret → 30 seconds
3. Trigger workflow → 10 seconds
4. ✅ Done forever (no expiration!)

**Total time**: ~2 minutes
**Maintenance**: Zero (token never expires)
