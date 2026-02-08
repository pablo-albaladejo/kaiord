# Publishing to GitHub Packages with OIDC

**Alternative to npm registry**: Publish to GitHub Packages using pure OIDC (no npm token needed).

## ⚠️ Important Considerations

### Pros:

- ✅ No npm token needed (uses GitHub OIDC)
- ✅ Automatic authentication via `permissions: packages: write`
- ✅ Free for public repositories
- ✅ Integrated with GitHub ecosystem

### Cons:

- ❌ Users need to configure custom registry
- ❌ Less discoverable (not on npm search)
- ❌ Requires GitHub authentication to install
- ❌ Not the standard npm registry

## Configuration

### 1. Update package.json files

Add `publishConfig` to each package:

```json
{
  "name": "@kaiord/core",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### 2. Update workflow

Replace npm authentication with GitHub token:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: 24.x
    registry-url: "https://npm.pkg.github.com"
    scope: "@kaiord"

- name: Publish to GitHub Packages
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }} # ← Uses GitHub token, not npm token
  run: pnpm exec changeset publish
```

### 3. Users need to configure registry

Users installing your packages need to add `.npmrc`:

```bash
@kaiord:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Recommendation

**Stick with npm registry** unless you have specific reasons to use GitHub Packages:

- npm is the standard
- Better discoverability
- No extra configuration for users
- Automation token (one-time setup) is not a burden

## Hybrid Approach

You could publish to **both**:

1. npm (primary, public discoverability)
2. GitHub Packages (backup, enterprise use)

This requires two publish steps in the workflow.
