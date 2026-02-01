# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## Creating a Changeset

When you make changes that should be released, run:

```bash
pnpm exec changeset
```

This will prompt you to:

1. **Select packages**: Choose which packages are affected (`@kaiord/core`, `@kaiord/cli`)
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

- **Linked packages**: `@kaiord/core` and `@kaiord/cli` are linked (same major/minor versions)
- **Ignored packages**: `@kaiord/workout-spa-editor` (private, not published)

See `config.json` for full configuration.
