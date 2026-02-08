# NPM Authentication for CI/CD

## Overview

npm provides several authentication methods for publishing packages from GitHub Actions. This guide explains the options and recommends the best approach.

## Authentication Options Comparison

| Method | Expiration | Best For | Setup Complexity |
|--------|------------|----------|------------------|
| **Automation Token** | Never* | ✅ CI/CD | Easy |
| Granular Token | 90 days | Short-term | Easy |
| Classic Token | Never* | ❌ Deprecated | Easy |
| OIDC (no token) | N/A | Future | Not yet available |

\* Subject to npm policy changes

## Recommended: Automation Token + Provenance

Automation tokens are designed specifically for CI/CD and don't expire (unless manually revoked). Combined with provenance, this provides the best security and maintenance experience.

### What is npm Provenance?

Provenance adds cryptographic proof to your packages showing:
- ✅ Where the package was built (GitHub Actions)
- ✅ Which commit/workflow published it
- ✅ Signed attestations for supply chain security

**Important**: Provenance **improves security** but **doesn't replace authentication**. You still need an npm token.

## Setup Guide

### Step 1: Create Automation Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click **"Generate New Token"** → **"Automation"**
3. Configure:
   - **Token Type**: Automation
   - **Description**: `kaiord-github-actions`
   - No expiration date (tokens don't expire)
4. Copy the token (shown only once!)

**Key difference from Granular tokens:**
- ✅ No expiration
- ✅ Designed for CI/CD
- ✅ Can publish to all packages under your account
- ⚠️ Less granular control (publishes to all scopes)

### Step 2: Set GitHub Secret

```bash
gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord
# Paste your automation token
```

### Step 3: Verify Workflow Configuration

The workflow is already configured with provenance:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: 24.x
    registry-url: "https://registry.npmjs.org"
    always-auth: true

- name: Publish to npm with provenance
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    NPM_CONFIG_PROVENANCE: true  # Enables provenance
  run: pnpm exec changeset publish
```

**What this does:**
- `NODE_AUTH_TOKEN`: Authenticates with npm (required)
- `NPM_CONFIG_PROVENANCE: true`: Adds provenance metadata
- `id-token: write`: Allows GitHub to sign provenance attestations

### Step 4: Test the Setup

```bash
# Trigger a manual workflow run
gh workflow run release.yml

# Watch the workflow
gh run watch
```

## Verifying Provenance

After publishing with provenance, you can verify packages:

```bash
# View provenance information
npm view @kaiord/core --json | jq '.dist.attestations'

# Verify package provenance
npm audit signatures
```

On npm website:
- Go to https://www.npmjs.com/package/@kaiord/core
- Look for the "Provenance" badge
- Click to see GitHub Actions details

## Understanding Token Types

### Automation Token ⭐ (Recommended)

**Pros:**
- ✅ Never expires
- ✅ Designed for CI/CD
- ✅ Simple to manage
- ✅ Works with provenance

**Cons:**
- ⚠️ Access to all packages in your account
- ⚠️ Less granular permissions

**Best for:** Production CI/CD pipelines

### Granular Token

**Pros:**
- ✅ Fine-grained permissions (per-package)
- ✅ Can restrict by IP (not useful for GH Actions)
- ✅ Works with provenance

**Cons:**
- ❌ Expires after 90 days (requires renewal)
- ⚠️ High maintenance overhead

**Best for:** Temporary access, external contractors

### Classic Token (Deprecated)

**Status:** ❌ Revoked by npm in 2024

**Don't use:** npm has deprecated classic tokens globally.

## What About OIDC Without Tokens?

You might have heard about publishing with OIDC without npm tokens. This is a future npm feature:

**Current Status (2026):**
- ❌ Not yet available
- 📋 Under discussion in npm/cli repository
- 🔮 May be available in future npm versions

**When available**, this would allow publishing with just GitHub's OIDC token, no npm token needed.

**For now**: Use Automation Token + Provenance (current best practice)

## Token Security Best Practices

### 1. Use Automation Tokens for CI/CD
```bash
# ✅ Good: Automation token
gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord

# ❌ Bad: Granular token (expires)
# Requires renewal every 90 days
```

### 2. Enable Provenance
```yaml
env:
  NPM_CONFIG_PROVENANCE: true  # ✅ Always enable
```

### 3. Restrict Workflow Permissions
```yaml
permissions:
  contents: write    # For git operations
  issues: write      # For GitHub releases
  id-token: write    # For provenance signing
  # Don't add unnecessary permissions
```

### 4. Monitor Token Usage
- Set up notifications for failed publishes
- Regularly check npm account access logs
- Rotate tokens if compromised

### 5. Use Separate Tokens per Project
```bash
# ✅ Good: Project-specific tokens
kaiord-ci-token
other-project-ci-token

# ❌ Bad: Shared tokens
my-personal-token (used everywhere)
```

## Troubleshooting

### "ENEEDAUTH" Error

**Cause:** Token is missing or invalid

**Solution:**
```bash
# 1. Verify secret exists
gh secret list --repo pablo-albaladejo/kaiord | grep NPM_TOKEN

# 2. Generate new automation token
# 3. Update secret
gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord
```

### "E403 Forbidden"

**Cause:** Token doesn't have publish permissions

**Solution:**
- Verify you're a maintainer of `@kaiord/*` packages on npm
- Check token type is "Automation" (not "Read only")
- Ensure token wasn't revoked

### Provenance Not Showing

**Cause:** Provenance flag not set or missing permissions

**Solution:**
```yaml
# Ensure workflow has:
permissions:
  id-token: write  # Required for provenance

env:
  NPM_CONFIG_PROVENANCE: true  # Required flag
```

### "npm ERR! need auth" with Valid Token

**Cause:** Token not properly passed to npm

**Solution:**
```yaml
- uses: actions/setup-node@v6
  with:
    registry-url: "https://registry.npmjs.org"
    always-auth: true  # ← Add this

env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}  # Must be NODE_AUTH_TOKEN
```

## Migration from Granular to Automation Token

If you currently have a granular token:

```bash
# 1. Create new automation token (see Step 1 above)

# 2. Update GitHub secret (overwrites old token)
gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord

# 3. Revoke old granular token on npm
# Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# Click "Delete" on the old token

# 4. Test publish
gh workflow run release.yml
```

## FAQ

**Q: Do automation tokens ever expire?**
A: No, unless manually revoked or if npm changes policies.

**Q: Can I use the same token for multiple projects?**
A: Yes, but it's better to use separate tokens per project for security isolation.

**Q: Is provenance required?**
A: No, but it's highly recommended for supply chain security.

**Q: What if npm changes token policies again?**
A: Automation tokens are the current standard. If policies change, npm will provide migration guidance.

**Q: Can I test provenance locally?**
A: No, provenance requires GitHub Actions OIDC. Use `--provenance` flag manually but signatures won't be valid.

**Q: Does provenance work with pnpm?**
A: Yes, pnpm passes the flag to npm. Use `NPM_CONFIG_PROVENANCE=true`.

## Further Reading

- [npm Token Documentation](https://docs.npmjs.com/about-access-tokens)
- [npm Provenance Guide](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Supply Chain Security](https://slsa.dev/)

## Summary

**Current Best Practice (2026):**

1. ✅ Use **Automation Token** (never expires)
2. ✅ Enable **Provenance** (supply chain security)
3. ✅ Use `NODE_AUTH_TOKEN` (required)
4. ✅ Set `id-token: write` (for provenance)
5. ✅ Monitor and test regularly

This eliminates token expiration issues while maintaining strong security posture.
