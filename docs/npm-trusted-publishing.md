# npm Trusted Publishing Setup (OIDC)

**Trusted Publishing** allows GitHub Actions to publish to npm without storing long-lived tokens as secrets. This is the modern, secure approach recommended by npm.

## How It Works

1. **GitHub Actions** generates a short-lived OIDC token
2. **npm** verifies the token is from your authorized repository/workflow
3. **Package is published** without manual token management

**Benefits:**

- ✅ No token expiration (no 90-day renewal)
- ✅ No secrets to manage
- ✅ Better security (short-lived tokens)
- ✅ Automatic provenance (supply chain security)

## Setup Steps

### Step 1: Configure Trusted Publisher on npm (REQUIRED)

This is the **critical step** that enables tokenless publishing.

For **each package** you want to publish:

1. Go to https://www.npmjs.com/package/@kaiord/PACKAGE_NAME/access
2. Scroll to **"Automation Tokens"** section
3. Click **"Configure Trusted Publishers"** or **"Add Trusted Publisher"**
4. Select **"GitHub Actions"**
5. Fill in the form:
   ```
   Repository owner: pablo-albaladejo
   Repository name: kaiord
   Workflow name: Release
   Environment: (leave empty)
   ```
6. Click **"Add"**

**Repeat for all packages:**

- @kaiord/core
- @kaiord/fit
- @kaiord/tcx
- @kaiord/zwo
- @kaiord/garmin
- @kaiord/cli

**Note:** The "Workflow name" must match exactly the `name:` field at the top of your `.github/workflows/release.yml` file.

### Step 2: Verify Workflow Configuration

Your workflow already has the required configuration:

```yaml
name: Release # ← Must match npm Trusted Publisher config

permissions:
  contents: write # For git operations
  issues: write # For GitHub releases
  id-token: write # ← REQUIRED for OIDC

jobs:
  release:
    steps:
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          registry-url: "https://registry.npmjs.org" # ← REQUIRED

      - name: Publish to npm with provenance
        env:
          NPM_CONFIG_PROVENANCE: true # ← Enables provenance
        run: pnpm exec changeset publish
```

✅ Your workflow is correctly configured.

### Step 3: Verify Package Configuration

All packages must have:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

✅ All your packages already have this.

### Step 4: Test the Setup

Create a test changeset and push:

```bash
# Create a patch changeset
pnpm exec changeset
# Select @kaiord/core, choose "patch", write "test: verify trusted publishing"

# Commit and push
git add .changeset
git commit -m "test: verify npm trusted publishing"
git push
```

The workflow will:

1. ✅ Generate OIDC token automatically
2. ✅ Authenticate with npm via Trusted Publisher
3. ✅ Publish with provenance
4. ✅ Create GitHub releases

### Step 5: Verify Success

After the workflow completes:

```bash
# Check new version
npm view @kaiord/core version

# Verify provenance badge
# Visit: https://www.npmjs.com/package/@kaiord/core
# Look for green "Provenance" badge with checkmark
```

## Troubleshooting

### "ENEEDAUTH: need auth" Error

**Cause:** Trusted Publisher not configured on npm.com

**Solution:**

1. Verify you completed Step 1 for the package
2. Check workflow name matches exactly: `Release`
3. Verify repository owner/name are correct
4. Wait a few minutes for npm to propagate the configuration

### "Invalid workflow" Error

**Cause:** Workflow name doesn't match

**Solution:**

- Workflow name in `.github/workflows/release.yml` must be exactly `Release`
- Check for typos or extra spaces

### Workflow Doesn't Trigger

**Cause:** Missing paths or no changesets

**Solution:**

- Verify `.changeset/*.md` files exist (except README.md)
- Check paths in workflow include your package directory
- Trigger manually: `gh workflow run release.yml`

### Provenance Not Showing

**Cause:** Missing `NPM_CONFIG_PROVENANCE` or `id-token` permission

**Solution:**

```yaml
permissions:
  id-token: write # Must be present

env:
  NPM_CONFIG_PROVENANCE: true # Must be set
```

## Migration from Token-Based Publishing

If you previously used `NPM_TOKEN`:

### Option A: Keep Token as Fallback (Hybrid)

```yaml
- name: Publish to npm
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} # Fallback
    NPM_CONFIG_PROVENANCE: true
  run: pnpm exec changeset publish
```

This works with both:

- Trusted Publishing (when configured on npm)
- Token-based (when Trusted Publisher not configured)

### Option B: Remove Token Completely (Recommended)

1. Configure Trusted Publishers on npm (Step 1)
2. Remove `NODE_AUTH_TOKEN` from workflow
3. Delete `NPM_TOKEN` secret from GitHub:
   ```bash
   gh secret delete NPM_TOKEN --repo pablo-albaladejo/kaiord
   ```

## FAQ

**Q: Do I need to configure this for each package?**
A: Yes, each package needs its own Trusted Publisher configuration on npm.com.

**Q: Can I use both Trusted Publishing and tokens?**
A: Yes, you can keep `NODE_AUTH_TOKEN` as a fallback. npm will prefer Trusted Publishing if configured.

**Q: What if I add a new package?**
A: Configure Trusted Publisher for the new package on npm.com before first publish.

**Q: Does this work with pnpm?**
A: Yes, pnpm calls npm publish internally, which handles OIDC.

**Q: How do I know if it's working?**
A: Check workflow logs for "Publishing with provenance" and verify the provenance badge on npm.

**Q: What about provenance?**
A: Trusted Publishing **automatically includes provenance**. Users can verify your packages came from your GitHub repo.

**Q: Is this more secure than tokens?**
A: Yes! Short-lived OIDC tokens are more secure than long-lived tokens that could be leaked.

## Security Benefits

**Trusted Publishing provides:**

1. **No Secret Storage**: No long-lived tokens in GitHub Secrets
2. **Short-Lived Tokens**: OIDC tokens expire in minutes
3. **Repository Binding**: Only your specific repo/workflow can publish
4. **Provenance**: Cryptographic proof of package origin
5. **Audit Trail**: Complete history of who published what from where

## Resources

- [npm Trusted Publishers Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance Guide](https://docs.npmjs.com/generating-provenance-statements)

## Summary

**To enable Trusted Publishing:**

1. ✅ Configure Trusted Publisher on npm.com for each package (CRITICAL)
2. ✅ Workflow has `id-token: write` permission (already configured)
3. ✅ Workflow has `NPM_CONFIG_PROVENANCE: true` (already configured)
4. ✅ Packages have `"access": "public"` (already configured)

**After setup:** Publish works automatically without any tokens! 🎉
