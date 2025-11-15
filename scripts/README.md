# Scripts

This directory contains utility scripts for the Kaiord project.

## npm Publishing Setup Scripts

### Quick Setup (Recommended)

```bash
pnpm setup:npm
```

**What it does:**

- Checks npm authentication (prompts login if needed)
- Opens browser to create automation token
- Configures GitHub secret using GitHub CLI
- Verifies configuration

**Requirements:**

- npm installed
- GitHub CLI (`gh`) installed
- Internet connection

**Time:** ~2 minutes

---

### Full Setup (Advanced)

```bash
pnpm setup:npm:full
```

**What it does:**

- All features from quick setup
- Additional validation checks
- More detailed output
- Option to save token to ~/.npmrc

**Requirements:**

- npm installed
- GitHub CLI (`gh`) installed (optional)
- jq installed (optional, for JSON parsing)

**Time:** ~5 minutes

---

## Script Details

### `quick-setup-npm.sh`

Simple, streamlined setup script.

**Features:**

- Minimal prompts
- Automatic browser opening for token creation
- GitHub CLI integration
- Quick verification

**Usage:**

```bash
./scripts/quick-setup-npm.sh
```

**Exit codes:**

- `0` - Success
- `1` - Error (missing prerequisites, authentication failed, etc.)

---

### `setup-npm-publishing.sh`

Comprehensive setup script with detailed checks.

**Features:**

- Step-by-step guidance
- Prerequisite checking
- Multiple authentication methods
- Detailed verification
- Optional token saving to ~/.npmrc
- Fallback for manual configuration

**Usage:**

```bash
./scripts/setup-npm-publishing.sh
```

**Exit codes:**

- `0` - Success
- `1` - Error (missing prerequisites, authentication failed, etc.)

---

## Prerequisites

### Required

- **Node.js & npm** - For npm authentication and token creation

  ```bash
  # Check if installed
  node --version
  npm --version
  ```

- **GitHub CLI** - For automatic secret configuration

  ```bash
  # Install on macOS
  brew install gh

  # Install on Linux
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update
  sudo apt install gh

  # Verify installation
  gh --version
  ```

### Optional

- **jq** - For JSON parsing (full setup script only)

  ```bash
  # Install on macOS
  brew install jq

  # Install on Linux
  sudo apt install jq
  ```

---

## Troubleshooting

### "npm: command not found"

**Solution:** Install Node.js and npm

```bash
# macOS
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### "gh: command not found"

**Solution:** Install GitHub CLI

```bash
# macOS
brew install gh

# Linux
# See prerequisites section above

# Verify
gh --version
```

### "gh auth status" fails

**Solution:** Authenticate with GitHub

```bash
gh auth login
# Follow the prompts to authenticate
```

### npm login fails

**Possible causes:**

- Incorrect credentials
- 2FA not configured
- Network issues

**Solution:**

```bash
# Try logging in manually
npm login

# If 2FA is enabled, you'll need:
# - Username
# - Password
# - 2FA code from authenticator app
```

### Token creation fails

**Solution:** Create token manually

1. Go to https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens
2. Click "Generate New Token"
3. Select "Automation" type
4. Copy the token
5. Paste when prompted by script

### GitHub secret configuration fails

**Possible causes:**

- Not authenticated with GitHub CLI
- Insufficient permissions
- Network issues

**Solution:**

```bash
# Re-authenticate with GitHub CLI
gh auth login

# Or configure manually:
# 1. Go to https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions
# 2. Create secret named NPM_TOKEN
# 3. Paste token value
```

---

## Manual Configuration

If the scripts don't work for your environment, you can configure manually:

### 1. Create npm Token

```bash
# Login to npm
npm login

# Visit token creation page
open https://www.npmjs.com/settings/$(npm whoami)/tokens/create

# Or use this command (may require manual interaction)
npm token create --type=automation
```

### 2. Configure GitHub Secret

**Option A: Using GitHub CLI**

```bash
# Set the secret
echo "YOUR_NPM_TOKEN" | gh secret set NPM_TOKEN --repo pablo-albaladejo/kaiord
```

**Option B: Using GitHub Web UI**

1. Go to https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: [paste your token]
5. Click "Add secret"

### 3. Verify Configuration

```bash
# Check npm authentication
npm whoami

# Check package access
npm access list packages

# Check GitHub secret (won't show value, just confirms it exists)
gh secret list --repo pablo-albaladejo/kaiord
```

---

## Security Notes

### Token Security

- **Never commit tokens** to git
- **Never share tokens** publicly
- **Rotate tokens** every 90 days
- **Use automation tokens** for CI/CD (not publish tokens)
- **Revoke old tokens** after creating new ones

### Token Storage

The scripts offer to save tokens to `~/.npmrc`:

```bash
# Token is stored in this format
//registry.npmjs.org/:_authToken=npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**

- This file should have restricted permissions: `chmod 600 ~/.npmrc`
- Never commit this file to git
- Add to `.gitignore` if not already present

### GitHub Secret Security

- Secrets are encrypted at rest
- Only visible to workflow runs
- Can be rotated without changing workflows
- Access is logged in audit trail

---

## Next Steps

After running the setup script:

1. **Test manual publishing** (optional):

   ```bash
   pnpm -r build
   pnpm --filter @kaiord/core publish --access public --dry-run
   ```

2. **Test automated publishing**:

   ```bash
   pnpm exec changeset
   git add .changeset/
   git commit -m "chore: test release"
   git push
   ```

3. **Monitor workflow**:
   - Go to https://github.com/pablo-albaladejo/kaiord/actions
   - Watch for "Changesets" workflow
   - Review "Version Packages" PR when created
   - Merge PR to trigger release

---

## Additional Resources

- **npm Publishing Guide:** `.github/NPM_PUBLISHING.md`
- **Setup Checklist:** `.github/SETUP_CHECKLIST.md`
- **Workflow Documentation:** `.github/workflows/README.md`
- **npm Token Documentation:** https://docs.npmjs.com/creating-and-viewing-access-tokens
- **GitHub CLI Documentation:** https://cli.github.com/manual/

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review script output for error messages
3. Check prerequisites are installed
4. Try manual configuration
5. Create an issue: https://github.com/pablo-albaladejo/kaiord/issues
