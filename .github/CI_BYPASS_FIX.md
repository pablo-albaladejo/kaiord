# Fix: CI Cannot Push to Main

## Current Status

✅ Ruleset configured: Owner can bypass
✅ Secret configured: CI_BYPASS_TOKEN exists
❌ Token missing permission: Workflows

## The Problem

The CI workflow fails with:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
```

This happens because the `CI_BYPASS_TOKEN` doesn't have the **Workflows** permission.

## The Solution

Update your Personal Access Token to include the Workflows permission.

### Steps

1. **Go to your tokens page**:

   ```
   https://github.com/settings/tokens
   ```

2. **Find and edit** the token named "Kaiord CI Bypass" (or whatever you named it)

3. **Add Workflows permission**:
   - Scroll to "Repository permissions"
   - Find **Workflows**
   - Change to: **Read and write**

4. **Save changes**

5. **If the token value changed**, update the secret:

   ```bash
   gh secret set CI_BYPASS_TOKEN --repo pablo-albaladejo/kaiord
   # Paste the new token when prompted
   ```

6. **Re-run the failed workflow** from GitHub Actions UI

## Required Token Permissions

Your `CI_BYPASS_TOKEN` must have these permissions:

| Permission    | Access Level       | Why                          |
| ------------- | ------------------ | ---------------------------- |
| Contents      | Read and write     | Push commits to main         |
| Metadata      | Read-only          | Automatic                    |
| Pull requests | Read and write     | Update PR status             |
| **Workflows** | **Read and write** | **Bypass branch protection** |

## Verification

After updating the token, verify it works:

```bash
# Check the token has correct permissions
gh api user -H "Authorization: token YOUR_TOKEN" | jq '{login, type}'

# Re-run the failed workflow
gh run rerun <run-id> --repo pablo-albaladejo/kaiord
```

## Alternative: Disable PR Requirement for CI Commits

If you don't want to use a PAT, you can modify the ruleset to allow direct pushes for version commits:

1. Go to: https://github.com/pablo-albaladejo/kaiord/settings/rules
2. Edit "Protect main - require PR (owner can bypass)"
3. Add a condition to exclude commits with `[skip ci]` or `chore: version packages`

However, this is more complex and the PAT approach is recommended.

## Why This Happens

- GitHub Actions uses `GITHUB_TOKEN` by default
- `GITHUB_TOKEN` cannot bypass branch protection rules
- Personal Access Tokens (PAT) inherit the user's permissions
- Your user has bypass permission (as repository owner)
- But the PAT needs **Workflows** permission to act on your behalf

## Security Note

The `CI_BYPASS_TOKEN` has your user's permissions. This is safe because:

- ✅ Only used in trusted workflows (changesets, auto-changeset)
- ✅ Commits are tagged with `[skip ci]` to prevent loops
- ✅ All changes are audited in git history
- ✅ Token is scoped to this repository only
- ✅ Token expires (set expiration when creating)

## References

- [GitHub Fine-grained PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)
- [Repository Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Workflows Permission](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
