# Husky Git Hooks

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Configured Hooks

### pre-commit

Runs automatically before every commit.

**What it does:**

1. Runs `pnpm build` to build all packages in the monorepo
2. Blocks commit if build fails
3. Runs `pnpm test` to execute all tests in the monorepo
4. Blocks commit if any tests fail
5. Shows clear error messages for failures

**Why this is important:**

- ✅ Ensures code compiles before committing
- ✅ Catches TypeScript errors early
- ✅ Catches bugs before they reach the repository
- ✅ Ensures all tests pass locally before CI/CD
- ✅ Prevents broken code from being committed
- ✅ Saves CI/CD time and resources
- ✅ Maintains code quality standards

**Example workflow:**

```bash
# Make changes
git add .
git commit -m "feat: add new feature"

# Husky runs build and tests automatically
# 🏗️  Running build before commit...
# ✅ Build passed!
# 🧪 Running tests before commit...
# ✅ All tests passed!

# If build fails:
# ❌ Build failed! Commit blocked.
# Fix the build errors and try again.

# If tests fail:
# ❌ Tests failed! Commit blocked.
# Fix the failing tests and try again:
#   pnpm test:watch
```

**To skip (not recommended):**

```bash
git commit --no-verify
```

**Note:** Skipping build and tests is strongly discouraged. If you must skip, ensure both build and tests pass before pushing.

---

### pre-push

Runs automatically before every push.

**What it does:**

1. Runs `pnpm lint:fix` to auto-fix linting issues
2. Checks if any files were modified by lint:fix
3. If changes were made, blocks the push and asks you to commit them
4. If no changes, allows the push to proceed

**Example workflow:**

```bash
# Make changes
git add .
git commit -m "feat: add feature"

# Try to push
git push

# If lint:fix makes changes:
# ⚠️  Lint fixes were applied. Please review and commit the changes.
# Run: git add . && git commit --amend --no-edit

# Review the changes
git diff

# Commit the fixes
git add .
git commit --amend --no-edit

# Push again
git push
# ✅ Lint check passed!
```

**To skip (not recommended):**

```bash
git push --no-verify
```

---

## Why These Hooks?

### pre-push with lint:fix

**Benefits:**

- ✅ Ensures code is properly formatted before pushing
- ✅ Catches linting issues early
- ✅ Prevents CI failures due to formatting
- ✅ Keeps codebase consistent
- ✅ Auto-fixes issues when possible

**Why pre-push instead of pre-commit?**

- Faster local development (no delay on every commit)
- Allows WIP commits without formatting
- Still catches issues before they reach CI
- Only runs when you're ready to share code

---

## Disabling Hooks

### Temporarily (single command)

```bash
# Skip pre-commit
git commit --no-verify

# Skip pre-push
git push --no-verify
```

### Permanently (not recommended)

```bash
# Remove all hooks
rm -rf .husky

# Or disable in package.json
# Remove the "prepare": "husky" script
```

---

## Troubleshooting

### Hook not running

**Check if Husky is installed:**

```bash
pnpm install
```

**Check if hooks are executable:**

```bash
chmod +x .husky/pre-push
chmod +x .husky/pre-commit
```

### Hook fails with "command not found"

**Ensure pnpm is in PATH:**

```bash
which pnpm
# Should output: /path/to/pnpm
```

**If not found, add to PATH or use full path in hook:**

```bash
# In .husky/pre-push
/path/to/pnpm lint:fix
```

### Want to modify a hook

Edit the hook file directly:

```bash
# Edit pre-push hook
nano .husky/pre-push

# Make it executable
chmod +x .husky/pre-push
```

---

## Adding New Hooks

### Create a new hook

```bash
# Create the hook file (Husky v9+ format - no shebang needed)
echo '# Your commands here
echo "Running custom hook..."
' > .husky/my-hook

# Make it executable
chmod +x .husky/my-hook
```

**Note:** Husky v9+ uses a simplified format without the `#!/usr/bin/env sh` shebang and `. "$(dirname -- "$0")/_/husky.sh"` line. These are deprecated and will fail in v10.

### Available Git hooks

- `pre-commit` - Before commit
- `prepare-commit-msg` - Before commit message editor
- `commit-msg` - After commit message
- `post-commit` - After commit
- `pre-push` - Before push
- `post-merge` - After merge
- `post-checkout` - After checkout

---

## Best Practices

### DO ✅

- Keep hooks fast (< 5 seconds)
- Provide clear error messages
- Auto-fix when possible
- Document what each hook does
- Test hooks before committing

### DON'T ❌

- Run long-running tasks (use CI instead)
- Block commits for warnings
- Modify files without user knowledge
- Skip hooks regularly (fix the issue instead)
- Add hooks that require manual input

---

## Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Questions?** See the main project README or create an issue.
