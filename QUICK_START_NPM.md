# 🚀 Quick Start: npm Publishing

## 🎉 New: Trusted Publishing (Recommended)

npm now recommends **Trusted Publishing** - no tokens needed!

### Quick Setup

1. **Publish manually once:**

   ```bash
   npm login
   pnpm -r build
   pnpm --filter @kaiord/core publish --access public
   ```

2. **Configure trusted publishing on npm:**
   - Go to https://www.npmjs.com/package/@kaiord/core/access
   - Click "Configure trusted publishers"
   - Add: `pablo-albaladejo/kaiord` + workflow `release.yml`

3. **Done!** Future releases publish automatically, no tokens needed.

📖 **Detailed guide:** `.github/NPM_TRUSTED_PUBLISHING.md`

---

## Alternative: Token-Based (Legacy)

If you prefer using tokens:

```bash
pnpm setup:npm
```

---

## What You Need

1. **npm account** - Create at https://www.npmjs.com/signup (if you don't have one)
2. **For trusted publishing:** Just your npm account
3. **For token-based:** GitHub CLI (`brew install gh`)

---

## Step by Step

### 1. Run the Setup Script

```bash
pnpm setup:npm
```

### 2. Follow the Prompts

The script will:

1. **Check if you're logged in to npm**
   - If not, it will prompt you to login
   - You'll need your npm username, password, and 2FA code (if enabled)

2. **Open your browser to create a token**
   - Configure the token (see details below)
   - Click "Generate Token"
   - Copy the token

   **Token Configuration:**
   - Token name: `kaiord-ci-cd`
   - Expiration: 90 days
   - Packages: Select `@kaiord/core` with "Read and write"
   - Organizations: (leave empty)
   - IP ranges: (leave empty)

   📖 **Detailed guide:** `.github/NPM_TOKEN_GUIDE.md`

3. **Ask you to paste the token**
   - Paste the token you just copied
   - Press Enter

4. **Configure GitHub automatically**
   - The script will set the `NPM_TOKEN` secret in GitHub
   - You'll see a success message

5. **Verify everything**
   - Shows your package version
   - Shows if it's already published
   - Shows next steps

### 3. Test It

```bash
# Create a changeset
pnpm exec changeset

# Commit and push
git add .changeset/
git commit -m "chore: test release"
git push

# Wait for "Version Packages" PR
# Merge it when ready
# Watch the magic happen! 🎉
```

---

## What If Something Goes Wrong?

### "gh: command not found"

Install GitHub CLI:

```bash
brew install gh
```

### "npm: command not found"

Install Node.js:

```bash
brew install node
```

### Script fails

Try the manual setup:

1. Go to https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens
2. Create "Automation" token
3. Go to https://github.com/pablo-albaladejo/kaiord/settings/secrets/actions
4. Create secret named `NPM_TOKEN`
5. Paste the token

---

## Need More Help?

- **Detailed guide:** `.github/SETUP_CHECKLIST.md`
- **Full documentation:** `.github/NPM_PUBLISHING.md`
- **Script docs:** `scripts/README.md`
- **Complete summary:** `.github/FINAL_SUMMARY.md`

---

## That's It!

Once the script completes, you're ready to publish packages to npm automatically. Just create changesets and merge the "Version Packages" PR when ready.

**Happy publishing! 🎉**
