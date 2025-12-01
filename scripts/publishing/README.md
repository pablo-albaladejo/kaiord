# Publishing Scripts

Scripts for automated npm package publishing workflow.

## Scripts

### `detect-package-changes.sh`

Detects which packages have changed between two commits.

**Usage:**

```bash
./scripts/detect-package-changes.sh [prev_commit] [current_commit]
```

**Default:** Compares `HEAD~1` with `HEAD`

**Output:**

```
CORE_CHANGED=true|false
CLI_CHANGED=true|false
HAS_CHANGES=true|false
```

**Example:**

```bash
./scripts/detect-package-changes.sh HEAD~1 HEAD
```

### `generate-changesets.sh`

Auto-generates changeset files for changed packages.

**Usage:**

```bash
./scripts/generate-changesets.sh <core_changed> <cli_changed> <commit_sha>
```

**Parameters:**

- `core_changed`: `true` or `false` - whether @kaiord/core changed
- `cli_changed`: `true` or `false` - whether @kaiord/cli changed
- `commit_sha`: Git commit SHA for reference

**Example:**

```bash
./scripts/generate-changesets.sh true false abc123def
```

**Output:**

- Creates `.changeset/auto-core-*.md` if core changed
- Creates `.changeset/auto-cli-*.md` if cli changed
- Removes any existing auto-generated changesets first

### `create-github-releases.js`

Creates GitHub releases for published packages.

**Usage:**

```bash
GITHUB_TOKEN=<token> GITHUB_REPOSITORY=owner/repo node scripts/create-github-releases.js
```

**Environment Variables:**

- `GITHUB_TOKEN`: GitHub API token with repo permissions
- `GITHUB_REPOSITORY`: Repository in format "owner/repo"

**Features:**

- Reads package versions from `package.json`
- Extracts changelog using `extract-changelog.sh`
- Creates releases with package-scoped tags (`@kaiord/core@1.0.0`)
- Skips if release already exists

**Example:**

```bash
export GITHUB_TOKEN="ghp_..."
export GITHUB_REPOSITORY="pablo-albaladejo/kaiord"
node scripts/create-github-releases.js
```

## Workflow Integration

These scripts are used by `.github/workflows/changesets.yml`:

1. **Detect changes** → `detect-package-changes.sh`
2. **Generate changesets** → `generate-changesets.sh`
3. **Version packages** → `changeset version` (built-in)
4. **Publish to npm** → `changeset publish` (built-in)
5. **Create releases** → `create-github-releases.js`

## Manual Testing

Test the complete flow locally:

```bash
# 1. Detect changes
./scripts/detect-package-changes.sh HEAD~1 HEAD

# 2. Generate changesets (if changes detected)
./scripts/generate-changesets.sh true false $(git rev-parse HEAD)

# 3. Version packages
pnpm exec changeset version

# 4. Build packages
pnpm -r build

# 5. Publish (dry-run)
pnpm exec changeset publish --dry-run

# 6. Create releases (requires GitHub token)
export GITHUB_TOKEN="ghp_..."
export GITHUB_REPOSITORY="pablo-albaladejo/kaiord"
node scripts/create-github-releases.js
```

## Troubleshooting

### Script not executable

```bash
chmod +x scripts/detect-package-changes.sh
chmod +x scripts/generate-changesets.sh
chmod +x scripts/create-github-releases.js
```

### Changes not detected

Ensure you're comparing the correct commits:

```bash
git log --oneline -5  # See recent commits
./scripts/detect-package-changes.sh <commit1> <commit2>
```

### Changesets not generated

Check script output:

```bash
bash -x ./scripts/generate-changesets.sh true false abc123
```

### GitHub releases fail

Verify token permissions:

- Token needs `repo` scope
- Token must not be expired
- Repository format must be `owner/repo`
