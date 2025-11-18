# Husky v9 Migration

## Changes Made

### 1. Removed Deprecated Shebang and Source Line

**Before (deprecated):**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running hook..."
```

**After (v9+ format):**

```bash
echo "Running hook..."
```

**Why:** Husky v9 simplified the hook format. The old format will fail in v10.

### 2. Added Build Step to Pre-commit

**Before:**

- Only ran tests

**After:**

- Runs build first
- Then runs tests

**Why:** Ensures TypeScript compilation succeeds before committing, catching type errors early.

### 3. Updated Documentation

- Updated README.md with new hook format
- Added migration notes
- Documented build step in pre-commit

## Verification

All hooks are now:

- ✅ Using Husky v9+ format (no deprecated lines)
- ✅ Executable (`chmod +x`)
- ✅ Documented in README.md

## Testing

Test the hooks manually:

```bash
# Test pre-commit (will run build + tests)
git add .
git commit -m "test: verify hooks"

# Test pre-push (will run lint:fix)
git push
```

## Rollback (if needed)

If you need to rollback to the old format:

```bash
git checkout HEAD~1 .husky/
```

## Next Steps

When upgrading to Husky v10:

- No changes needed - hooks are already in the correct format
- The old format would have failed in v10

## References

- [Husky v9 Migration Guide](https://typicode.github.io/husky/migrating-from-v8-to-v9.html)
- [Husky Documentation](https://typicode.github.io/husky/)
