# 📝 npm Granular Access Token Configuration Guide

## Quick Reference

When creating your npm token at:
https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens/granular-access-tokens/new

Use these settings:

```
┌─────────────────────────────────────────────────────────┐
│ Create New Granular Access Token                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Token name                                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ kaiord-ci-cd                                    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Expiration                                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 90 days                                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Packages and scopes                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ☑ @kaiord/core                                  │   │
│ │   Permissions: Read and write                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Organizations                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ (leave empty)                                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ IP ranges                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ (leave empty - allow from any IP)              │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│                    [Generate Token]                     │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Instructions

### 1. Token Name

**Field:** Token name  
**Value:** `kaiord-ci-cd` (or any descriptive name)

**Why:** Helps you identify this token later when managing multiple tokens.

---

### 2. Expiration

**Field:** Expiration  
**Value:** `90 days`

**Why:**

- Security best practice to rotate tokens regularly
- Balances security with convenience
- You can choose longer (up to 1 year) or shorter periods

**Options:**

- 30 days (high security)
- 90 days (recommended)
- 180 days (moderate)
- 1 year (maximum)
- No expiration (not recommended)

---

### 3. Packages and Scopes

**Field:** Packages and scopes  
**Action:** Click "Select packages and scopes"

**Configuration:**

1. Find and select: `@kaiord/core`
2. Set permissions: **Read and write**

**Why:**

- Limits token access to only the packages you need
- "Read and write" allows publishing new versions
- More secure than classic tokens with full account access

**Important:**

- Make sure to select **Read and write**, not just "Read"
- If you don't see `@kaiord/core`, you may need to publish it manually first

---

### 4. Organizations

**Field:** Organizations  
**Value:** (leave empty)

**Why:**

- Only needed if publishing to organization-scoped packages
- `@kaiord` is a user scope, not an organization

---

### 5. IP Ranges

**Field:** IP ranges  
**Value:** (leave empty)

**Why:**

- GitHub Actions uses dynamic IPs
- Restricting IPs would break CI/CD
- Leave empty to allow from any IP

**Note:** If you need IP restrictions for security, you can add GitHub Actions IP ranges, but this is complex and not recommended.

---

### 6. Generate Token

**Action:** Click "Generate Token"

**Result:**

- Token will be displayed once
- Format: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Copy it immediately - you won't see it again!

---

## Token Format

Your token should look like this:

```
npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Starts with `npm_`
- Followed by 40 random characters
- Total length: 44 characters

---

## Security Best Practices

### ✅ Do

- ✅ Use granular access tokens (not classic tokens)
- ✅ Set expiration to 90 days or less
- ✅ Limit to specific packages
- ✅ Copy token immediately after creation
- ✅ Store token securely (GitHub Secrets)
- ✅ Rotate tokens before expiration
- ✅ Revoke old tokens after creating new ones

### ❌ Don't

- ❌ Use classic "Automation" tokens (deprecated)
- ❌ Set "No expiration"
- ❌ Grant access to all packages
- ❌ Share tokens publicly
- ❌ Commit tokens to git
- ❌ Store tokens in plain text files
- ❌ Use the same token for multiple projects

---

## Troubleshooting

### "I don't see @kaiord/core in the package list"

**Cause:** Package hasn't been published yet

**Solution:**

1. Publish the package manually first:
   ```bash
   npm login
   pnpm --filter @kaiord/core publish --access public
   ```
2. Then create the token

**Alternative:** Use a classic token for first publish, then switch to granular token.

---

### "I can't find the granular token page"

**URL:** https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens/granular-access-tokens/new

**Alternative paths:**

1. Go to https://www.npmjs.com/
2. Click your profile picture → "Access Tokens"
3. Click "Generate New Token" → "Granular Access Token"

---

### "Token doesn't work in CI/CD"

**Check:**

1. Token has "Read and write" permissions (not just "Read")
2. Token includes `@kaiord/core` package
3. Token hasn't expired
4. Token is correctly set in GitHub Secrets as `NPM_TOKEN`

**Test locally:**

```bash
# Set token temporarily
export NPM_TOKEN="your_token_here"

# Test authentication
npm whoami --registry https://registry.npmjs.org

# Test publish (dry run)
pnpm --filter @kaiord/core publish --access public --dry-run
```

---

### "Token expired"

**Solution:**

1. Create a new token with same configuration
2. Update GitHub Secret `NPM_TOKEN` with new token
3. Revoke old token at https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens

**Tip:** Set a calendar reminder 1 week before expiration to rotate tokens proactively.

---

## Token Management

### Viewing Tokens

**URL:** https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens

**What you can see:**

- Token name
- Creation date
- Expiration date
- Last used date
- Packages with access

**What you can't see:**

- Token value (only shown once at creation)

---

### Revoking Tokens

**When to revoke:**

- Token is compromised
- Token is no longer needed
- After creating a replacement token
- When leaving a project

**How to revoke:**

1. Go to https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens
2. Find the token
3. Click "Delete" or "Revoke"
4. Confirm deletion

---

### Rotating Tokens

**Recommended schedule:** Every 90 days

**Process:**

1. Create new token (same configuration)
2. Update GitHub Secret with new token
3. Test that CI/CD works
4. Revoke old token
5. Update calendar reminder for next rotation

---

## Comparison: Granular vs Classic Tokens

| Feature         | Granular Token             | Classic Token                  |
| --------------- | -------------------------- | ------------------------------ |
| Security        | ✅ High (package-specific) | ⚠️ Lower (full account access) |
| Expiration      | ✅ Required                | ❌ Optional                    |
| Package scope   | ✅ Specific packages       | ❌ All packages                |
| IP restrictions | ✅ Supported               | ❌ Not supported               |
| Audit trail     | ✅ Detailed                | ⚠️ Basic                       |
| Recommended     | ✅ Yes                     | ❌ Deprecated                  |

**Recommendation:** Always use granular access tokens for new projects.

---

## Additional Resources

- **npm Token Documentation:** https://docs.npmjs.com/creating-and-viewing-access-tokens
- **Granular Tokens Guide:** https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-granular-access-tokens-on-the-website
- **Token Security:** https://docs.npmjs.com/about-access-tokens
- **GitHub Actions with npm:** https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages

---

## Quick Checklist

Before clicking "Generate Token", verify:

- [ ] Token name is descriptive (e.g., `kaiord-ci-cd`)
- [ ] Expiration is set (recommended: 90 days)
- [ ] `@kaiord/core` is selected in packages
- [ ] Permissions are set to "Read and write"
- [ ] Organizations field is empty
- [ ] IP ranges field is empty
- [ ] You're ready to copy the token immediately

After generating:

- [ ] Token copied to clipboard
- [ ] Token saved to GitHub Secrets as `NPM_TOKEN`
- [ ] Token tested locally (optional)
- [ ] Old token revoked (if replacing)
- [ ] Calendar reminder set for rotation

---

**Need help?** See `.github/SETUP_CHECKLIST.md` or run `pnpm setup:npm`
