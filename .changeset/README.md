# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## Creating a Changeset

When you make changes that should be released, run:

```bash
pnpm exec changeset
```

This will prompt you to:

1. **Select packages**: Choose which packages are affected (`@kaiord/core`, `@kaiord/cli`, `@kaiord/mcp`, etc.)
2. **Select bump type**: `patch` (bug fixes), `minor` (new features), `major` (breaking changes)
3. **Write summary**: Describe your changes (this becomes the changelog entry)

## When to Create a Changeset

**Required for:**

- Bug fixes
- New features
- Breaking changes
- API modifications

**Not required for:**

- Documentation-only changes
- Test additions/fixes
- Internal refactoring (no API changes)
- CI/CD changes

## Release Process

1. PRs with changesets are merged to `main`
2. The Release workflow automatically:
   - Bumps versions based on changesets
   - Updates `CHANGELOG.md` files
   - Publishes to npm
   - Creates GitHub Releases

## Configuration

- **Linked packages**: `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/cli`, `@kaiord/mcp`, and `@kaiord/ai` are linked (same major/minor versions)
- **Private packages** (`@kaiord/workout-spa-editor`, `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`) participate in the changesets flow — they get versioned and changelogged, but `"private": true` in their `package.json` keeps `npm publish` from uploading them

See `config.json` for full configuration.
