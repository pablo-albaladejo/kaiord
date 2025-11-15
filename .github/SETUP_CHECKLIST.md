# 🚀 CI/CD Setup Checklist

This checklist helps you complete the final configuration steps for the Kaiord CI/CD pipeline.

## ✅ Already Configured

The following are already set up and working:

- [x] CI workflow with intelligent change detection
- [x] Automated testing on multiple Node.js versions
- [x] Code quality checks (ESLint, Prettier, TypeScript)
- [x] Build verification
- [x] Security audit workflow
- [x] Changesets for version management
- [x] Release workflow for npm publishing
- [x] GitHub templates (issues, PRs)
- [x] Branch protection configuration
- [x] Status badges in README
- [x] Complete documentation

## 🔧 Configuration Required

### 1. npm Publishing Setup

**Status:** Workflows are ready, but requires user configuration

**🎉 Option A: Trusted Publishing (Recommended - No Tokens!)**

npm's new secure method - no secrets needed:

1. **Publish manually once:**

   ```bash
   npm login
   pnpm -r build
   pnpm --filter @kaiord/core publish --access public
   ```

2. **Configure on npm:**
   - Go to https://www.npmjs.com/package/@kaiord/core/access
   - Click "Configure trusted publishers"
   - Provider: GitHub Actions
   - Repository: `pablo-albaladejo/kaiord`
   - Workflow: `release.yml`
   - Click "Add"

3. **Done!** No tokens, no secrets, automatic provenance.

📖 **Detailed guide:** `.github/NPM_TRUSTED_PUBLISHING.md`

---

**Option B: Token-Based (Legacy)**

If you prefer using tokens:

**Quick Setup:**

```bash
pnpm setup:npm
```

**Manual Setup:**

If you prefer manual configuration:

1. **Create npm Account** (if you don't have one)
   - Go to https://www.npmjs.com/signup
   - Verify your email
   - (Optional) Enable 2FA

2. **Generate npm Granular Access Token**
   - Go to https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens/granular-access-tokens/new
   - Configure:
     - Token name: `kaiord-ci-cd`
     - Expiration: 90 days
     - Packages: Select `@kaiord/core` with Read and write permissions
   - Click "Generate Token"
   - Copy the token (shown only once)

3. **Configure GitHub Secret**
   - Go to https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: [paste your npm token]
   - Click "Add secret"

4. **Test Publishing**

   **Option A: Manual Test (Recommended First Time)**

   ```bash
   # Login to npm
   npm login

   # Build packages
   pnpm -r build

   # Publish manually
   pnpm --filter @kaiord/core publish --access public

   # Verify
   npm view @kaiord/core
   ```

   **Option B: Automated Test (After Manual Success)**

   ```bash
   # Create a changeset
   pnpm exec changeset
   # Select @kaiord/core, choose patch, describe changes

   # Commit and push
   git add .changeset/
   git commit -m "chore: test npm publishing workflow"
   git push

   # Wait for "Version Packages" PR to be created
   # Review and merge the PR
   # GitHub Release will be created automatically
   # npm publishing will trigger automatically
   ```

**Documentation:** See `.github/NPM_PUBLISHING.md` for detailed guide

**Time Required:** ~10 minutes

---

### 2. Codecov Integration (Optional)

**Status:** Workflow uploads coverage, but account setup is optional

**Benefits:**

- Coverage tracking over time
- PR comments with coverage diff
- Coverage trends and insights

**Steps:**

1. **Create Codecov Account**
   - Go to https://codecov.io/
   - Sign in with GitHub
   - Authorize access to `kaiord` repository

2. **Configure Settings**
   - Coverage threshold: 80%
   - Enable PR comments
   - Configure badge (already in README)

3. **Verify Integration**
   - Create a test PR
   - Check for Codecov comment
   - Verify badge updates

**Documentation:** https://docs.codecov.com/docs

**Time Required:** ~5 minutes

---

## 📋 Verification Checklist

After completing the configuration, verify everything works:

### npm Publishing

- [ ] `NPM_TOKEN` secret is configured in GitHub
- [ ] Manual publish works: `pnpm --filter @kaiord/core publish --access public`
- [ ] Package is visible on npm: https://www.npmjs.com/package/@kaiord/core
- [ ] Changeset workflow creates "Version Packages" PR
- [ ] Merging PR creates GitHub Release
- [ ] Release triggers npm publishing workflow
- [ ] npm version badge updates in README

### CI/CD Workflows

- [ ] CI workflow runs on PRs
- [ ] Tests pass on Node.js 20.x and 22.x
- [ ] Linting and type checking work
- [ ] Coverage reports are generated
- [ ] Security audit runs weekly
- [ ] Branch protection requires CI to pass

### Documentation

- [ ] README has all badges (CI, coverage, npm version)
- [ ] `.github/NPM_PUBLISHING.md` is complete
- [ ] `.github/workflows/README.md` documents workflows
- [ ] CONTRIBUTING.md explains contribution process

---

## 🎯 Quick Start Commands

### For Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test

# Run linting
pnpm lint

# Run type checking
pnpm exec tsc --noEmit
```

### For Publishing

```bash
# Create a changeset
pnpm exec changeset

# Check changeset status
pnpm exec changeset status

# Manual publish (emergency only)
npm login
pnpm --filter @kaiord/core publish --access public
```

### For Workflow Testing

```bash
# Test workflows locally with act
act pull_request

# View workflow runs
open https://github.com/pablo-albaladejo/kaiord/actions

# View latest release
open https://github.com/pablo-albaladejo/kaiord/releases
```

---

## 🆘 Troubleshooting

### npm Publishing Fails

**Error:** `401 Unauthorized`

- **Cause:** Invalid or expired npm token
- **Solution:** Generate new token and update `NPM_TOKEN` secret

**Error:** `403 Forbidden`

- **Cause:** Token lacks permissions or package name taken
- **Solution:** Verify token type is "Automation" and package name is available

**Error:** `Version already published`

- **Cause:** Trying to publish existing version
- **Solution:** Bump version with changeset or manually in package.json

### CI Workflow Fails

**Error:** Tests fail

- **Solution:** Run `pnpm -r test` locally to debug

**Error:** Linting fails

- **Solution:** Run `pnpm lint:fix` to auto-fix issues

**Error:** Build fails

- **Solution:** Run `pnpm -r build` locally to see errors

### Codecov Issues

**Error:** Coverage not uploading

- **Solution:** Check Codecov token in repository settings

**Error:** Badge not updating

- **Solution:** Clear browser cache or wait a few minutes

---

## 📚 Additional Resources

- **npm Publishing Guide:** `.github/NPM_PUBLISHING.md`
- **Workflow Documentation:** `.github/workflows/README.md`
- **Testing Workflows Locally:** `.github/TESTING_WORKFLOWS.md`
- **Contribution Guidelines:** `CONTRIBUTING.md`
- **Changesets Documentation:** https://github.com/changesets/changesets
- **GitHub Actions Documentation:** https://docs.github.com/en/actions

---

## ✨ Next Steps

1. **Configure npm token** (required for publishing)
2. **Test manual publish** to verify setup
3. **Test changeset workflow** to verify automation
4. **Set up Codecov** (optional but recommended)
5. **Create first release** with changeset
6. **Monitor workflows** in GitHub Actions

---

## 🎉 Success Criteria

You'll know everything is working when:

- ✅ CI workflow passes on every PR
- ✅ Changesets create "Version Packages" PR automatically
- ✅ Merging version PR creates GitHub Release
- ✅ Release triggers npm publishing
- ✅ Package is available on npm
- ✅ Badges update automatically in README
- ✅ Coverage reports are generated
- ✅ Security audits run weekly

---

**Need Help?** Create an issue at https://github.com/pablo-albaladejo/kaiord/issues
