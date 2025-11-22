# Scripts

This directory contains utility scripts for the Kaiord project.

## test-ci-workflows.sh

Simulates GitHub Actions CI workflows locally to catch deployment issues before pushing to GitHub.

### Purpose

This script validates the complete deployment process by:

1. **Core Build Test** - Ensures `@kaiord/core` builds successfully in a clean environment
2. **SPA Build Test** - Verifies the SPA builds with the core dependency
3. **Dependency Order Test** - Confirms the SPA fails without core and succeeds with it
4. **Deployment Simulation** - Validates GitHub Pages deployment requirements
5. **Build Reproducibility** - Ensures frozen lockfile is up to date

### Usage

```bash
# Make script executable (first time only)
chmod +x scripts/test-ci-workflows.sh

# Run all tests
./scripts/test-ci-workflows.sh
```

### When to Run

Run this script before:

- Pushing changes to `main` branch
- Creating a pull request that affects deployment
- Making changes to:
  - `packages/workout-spa-editor/**`
  - `packages/core/**`
  - `.github/workflows/deploy-spa-editor.yml`
  - `pnpm-lock.yaml`

### What It Tests

#### Test 1: Core Build Test

Simulates a clean CI environment:

```bash
# Removes build artifacts
rm -rf packages/core/dist

# Installs dependencies
pnpm install --frozen-lockfile

# Builds core package
pnpm --filter @kaiord/core build

# Verifies artifacts exist
- packages/core/dist/
- packages/core/dist/index.d.ts
- packages/core/dist/index.js
```

#### Test 2: SPA Build Test

Builds the SPA with core dependency:

```bash
# Removes SPA build artifacts
rm -rf packages/workout-spa-editor/dist

# Builds SPA with base path
VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build

# Verifies artifacts exist
- packages/workout-spa-editor/dist/
- packages/workout-spa-editor/dist/index.html
- packages/workout-spa-editor/dist/assets/
```

#### Test 3: Dependency Order Test

Validates build dependency order:

```bash
# Removes core dist
rm -rf packages/core/dist

# Attempts to build SPA (should fail)
pnpm --filter @kaiord/workout-spa-editor build  # ❌ Expected to fail

# Rebuilds core
pnpm --filter @kaiord/core build

# Builds SPA (should succeed)
pnpm --filter @kaiord/workout-spa-editor build  # ✅ Expected to succeed
```

#### Test 4: Deployment Simulation

Validates GitHub Pages requirements:

```bash
# Checks base path in index.html
grep 'src="/kaiord/' packages/workout-spa-editor/dist/index.html

# Verifies no hardcoded absolute URLs
! grep 'src="http' packages/workout-spa-editor/dist/index.html

# Validates artifact structure
- index.html at root
- assets/ directory exists
- JavaScript bundles present
- CSS bundles present
- Sourcemaps generated
```

#### Test 5: Build Reproducibility

Ensures consistent builds:

```bash
# Validates frozen lockfile
pnpm install --frozen-lockfile

# Checks lockfile is up to date
git diff --exit-code pnpm-lock.yaml
```

### Expected Output

```
🧪 Testing CI Workflows Locally
================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: Core Build Test (Clean Environment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Simulating CI environment by removing build artifacts...
ℹ️  Installing dependencies with frozen lockfile...
✅ Dependencies installed successfully
ℹ️  Building core package...
✅ Core package built successfully
ℹ️  Verifying core dist artifacts exist...
✅ Core dist directory exists
ℹ️  Verifying TypeScript declaration files...
✅ TypeScript declaration files present
ℹ️  Verifying JavaScript output files...
✅ JavaScript output files present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 2: SPA Build Test (With Core Dependency)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Removing SPA build artifacts...
ℹ️  Building SPA with core dependency...
✅ SPA built successfully
ℹ️  Verifying SPA dist artifacts exist...
✅ SPA dist directory exists
ℹ️  Verifying index.html exists...
✅ index.html present
ℹ️  Verifying assets directory exists...
✅ Assets directory present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 3: Dependency Order Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Removing core dist to simulate missing dependency...
ℹ️  Attempting to build SPA without core (should fail)...
✅ SPA correctly fails without core dependency
ℹ️  Rebuilding core package...
✅ Core package rebuilt
ℹ️  Building SPA with core dependency...
✅ SPA builds successfully with core dependency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 4: Deployment Simulation (GitHub Pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Verifying base path configuration in index.html...
✅ Base path correctly configured in index.html
ℹ️  Verifying no hardcoded absolute paths...
✅ No hardcoded absolute paths found
ℹ️  Verifying artifact structure matches GitHub Pages requirements...
✅ index.html at root of dist
✅ assets directory present
ℹ️  Checking for JavaScript bundles in assets...
✅ JavaScript bundles present (3 files)
ℹ️  Checking for CSS bundles in assets...
✅ CSS bundles present (1 files)
ℹ️  Verifying sourcemaps are generated...
✅ Sourcemaps present (4 files)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 5: Build Reproducibility
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Testing frozen lockfile enforcement...
✅ Frozen lockfile validation passed
ℹ️  Verifying pnpm-lock.yaml is up to date...
✅ pnpm-lock.yaml is up to date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tests Passed: 20
❌ Tests Failed: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

================================
✅ All CI workflow tests passed!
================================

You can now safely push to GitHub.
The deployment workflow should succeed.
```

### Troubleshooting

#### Script Fails: "Permission denied"

Make the script executable:

```bash
chmod +x scripts/test-ci-workflows.sh
```

#### Test Fails: "Core build failed"

Check for TypeScript errors:

```bash
cd packages/core
pnpm build
```

Fix any compilation errors and run the script again.

#### Test Fails: "SPA build failed"

Ensure core is built first:

```bash
pnpm --filter @kaiord/core build
pnpm --filter @kaiord/workout-spa-editor build
```

#### Test Fails: "Frozen lockfile validation failed"

Update the lockfile:

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
```

#### Test Fails: "Base path not found"

Ensure `VITE_BASE_PATH` is set:

```bash
VITE_BASE_PATH="/kaiord/" pnpm --filter @kaiord/workout-spa-editor build
```

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

### Integration with CI/CD

This script mirrors the GitHub Actions workflow (`.github/workflows/deploy-spa-editor.yml`):

| Script Test                   | Workflow Step                |
| ----------------------------- | ---------------------------- |
| Test 1: Core Build            | Build core package           |
| Test 2: SPA Build             | Build SPA Editor             |
| Test 3: Dependency Order      | (Implicit in workflow order) |
| Test 4: Deployment Simulation | Verify SPA build             |
| Test 5: Build Reproducibility | Install dependencies         |

### Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Complete deployment guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [.github/workflows/deploy-spa-editor.yml](../.github/workflows/deploy-spa-editor.yml) - Deployment workflow

## Other Scripts

### setup-npm-publishing.sh

Configures npm publishing with token-based authentication (legacy method).

**Recommended**: Use [Trusted Publishing](../.github/NPM_TRUSTED_PUBLISHING.md) instead.

### quick-setup-npm.sh

Quick setup script for npm publishing configuration for `@kaiord/core` package.

### quick-setup-npm-cli.sh

Quick setup script for npm publishing configuration for `@kaiord/cli` package using **token-based authentication** (legacy method).

**⚠️ Note:** Consider using `setup-trusted-publishing-cli.sh` instead for better security.

**Usage:**

```bash
# Make script executable (first time only)
chmod +x scripts/quick-setup-npm-cli.sh

# Run the setup
./scripts/quick-setup-npm-cli.sh
```

**What it does:**

1. Verifies npm authentication
2. Checks @kaiord scope access
3. Optionally creates/updates npm token
4. Configures GitHub secret (NPM_TOKEN)
5. Verifies package status on npm
6. Runs pre-publish checks (build, tests)
7. Provides next steps for publishing

**Next steps after running:**

```bash
# 1. Build the package
pnpm --filter @kaiord/cli build

# 2. Create changeset
pnpm exec changeset
# Select: @kaiord/cli
# Version: patch/minor/major

# 3. Commit and push
git add .changeset/ && git commit -m 'chore: release cli' && git push

# 4. Merge 'Version Packages' PR

# 5. Watch CI/CD
# https://github.com/pablo-albaladejo/kaiord/actions
```

**Manual publish (if needed):**

```bash
cd packages/cli && npm publish --access public
```

### setup-trusted-publishing-cli.sh

🔒 **Recommended:** Setup script for npm Trusted Publishing for `@kaiord/cli` package.

Trusted Publishing is more secure than tokens because:

- ✅ No secrets needed (uses OpenID Connect)
- ✅ Automatic verification by npm
- ✅ Cryptographic provenance attestation
- ✅ No token rotation required
- ✅ Eliminates token theft risk

**Usage:**

```bash
# Make script executable (first time only)
chmod +x scripts/setup-trusted-publishing-cli.sh

# Run the setup
./scripts/setup-trusted-publishing-cli.sh
```

**What it does:**

1. Verifies npm authentication
2. Checks if package is published (required for trusted publishing)
3. Optionally publishes package for the first time
4. Guides you through configuring trusted publishing on npm
5. Verifies workflow has correct permissions
6. Provides testing instructions
7. Suggests cleanup of old NPM_TOKEN (if exists)

**Configuration on npm:**

The script will guide you to configure on npm:

- Provider: **GitHub Actions**
- Repository owner: `pablo-albaladejo`
- Repository name: `kaiord`
- Workflow name: `release.yml` (or leave empty)
- Environment: (leave empty)

**Note:** `@kaiord` is an npm organization. Make sure you have admin access to configure trusted publishing.

**Testing trusted publishing:**

```bash
# 1. Create changeset
pnpm exec changeset
# Select: @kaiord/cli, Version: patch

# 2. Commit and push
git add .changeset/ && git commit -m 'chore: test trusted publishing' && git push

# 3. Merge 'Version Packages' PR

# 4. Verify provenance
npm view @kaiord/cli --json | jq '.dist.attestations'
```

**Documentation:**

See [NPM_TRUSTED_PUBLISHING.md](../.github/NPM_TRUSTED_PUBLISHING.md) for detailed information.

### test-workflow.sh

Tests individual GitHub Actions workflows locally using `act`.

See [TESTING_WORKFLOWS.md](../.github/TESTING_WORKFLOWS.md) for details.
