# Contributing to Kaiord

Thank you for your interest in contributing to Kaiord! This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [CI/CD Workflows](#cicd-workflows)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher
- **pnpm**: Version 9.x or higher
- **Git**: For version control
- **Docker**: For testing workflows locally (optional)

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/kaiord.git
   cd kaiord
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/pablo-albaladejo/kaiord.git
   ```

4. **Install dependencies**:

   ```bash
   pnpm install
   ```

5. **Build all packages**:

   ```bash
   pnpm -r build
   ```

6. **Run tests**:
   ```bash
   pnpm -r test
   ```

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your changes:

```bash
git checkout -b feature/my-feature
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

### 2. Make Your Changes

Follow the [Code Style Guidelines](#code-style-guidelines) and ensure your changes:

- Are focused and atomic (one feature/fix per PR)
- Include tests for new functionality
- Update documentation as needed
- Follow the project's architecture patterns

### 3. Test Your Changes

Run the full test suite:

```bash
# Run all tests
pnpm -r test

# Run tests with coverage
pnpm -r test:coverage

# Run linting (ESLint + Prettier)
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Run type checking
pnpm exec tsc --noEmit
```

### 4. Add a Changeset

For changes that affect package versions (features, fixes, breaking changes), add a changeset:

```bash
pnpm exec changeset
```

This will prompt you to:

1. Select which packages are affected
2. Choose the version bump type (major, minor, patch)
3. Write a summary of your changes

**When to add a changeset:**

- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Performance improvements
- ❌ Documentation-only changes
- ❌ Test-only changes
- ❌ Internal refactoring with no API changes

### 5. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add TCX format support"
git commit -m "fix: resolve power target conversion issue"
git commit -m "docs: update README with new examples"
```

Commit message format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/my-feature
```

Then create a pull request on GitHub with:

- Clear title describing the change
- Description of what changed and why
- Reference to related issues (if any)
- Screenshots or examples (if applicable)

## Code Style Guidelines

### TypeScript

- **Strict mode**: All code must pass TypeScript strict checks
- **No `any` types**: Avoid `any` unless absolutely necessary with justification
- **Type inference**: Let TypeScript infer types when possible
- **Explicit return types**: For public APIs and complex functions

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `duration-converter.ts`)
- **Functions**: `camelCase` (e.g., `convertFitToKrd`)
- **Types**: `PascalCase` (e.g., `WorkoutStep`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

### Code Organization

- **File size**: Maximum 100 lines per file (excluding tests)
- **Function size**: Maximum 40 lines per function
- **Single responsibility**: Each file/function should have one clear purpose
- **Co-located tests**: Test files should be next to source files

### Architecture

Kaiord follows **Hexagonal Architecture** (Ports & Adapters):

```
packages/core/src/
├── domain/          # Pure business logic (no external dependencies)
├── application/     # Use cases (depends on ports only)
├── ports/           # Interface contracts
└── adapters/        # External integrations (FIT, TCX, ZWO)
```

**Rules:**

- Domain layer depends on nothing
- Application layer depends only on domain and ports
- Adapters implement ports and may use external libraries
- Never import adapters in application layer

### Zod Schemas

All data validation uses Zod schemas:

- Define schemas first, infer types after
- Use `z.enum()` for enumerations
- Use `z.discriminatedUnion()` for variant types
- Validate at boundaries (CLI, adapters)

Example:

```typescript
// Define schema
export const sportSchema = z.enum(["cycling", "running", "swimming"]);

// Infer type
export type Sport = z.infer<typeof sportSchema>;

// Use in validation
const result = sportSchema.safeParse(input);
```

## Testing Requirements

### Test Coverage

- **Overall**: ≥ 70% coverage (enforced in CI)
- **Converters**: ≥ 90% coverage
- **Critical paths**: 100% coverage

### Test Types

1. **Unit Tests**: Test individual functions and modules

   ```typescript
   describe("convertPowerTarget", () => {
     it("should convert watts to FIT format", () => {
       // Arrange
       const target = { type: "power", value: { unit: "watts", value: 250 } };

       // Act
       const result = convertPowerTarget(target);

       // Assert
       expect(result.targetValue).toBe(1250); // 250 + 1000 offset
     });
   });
   ```

2. **Integration Tests**: Test component interactions

3. **Round-trip Tests**: Ensure lossless conversions

   ```typescript
   it("should preserve data in FIT → KRD → FIT conversion", async () => {
     const originalFit = readFitFile("workout.fit");
     const krd = await convertFitToKrd(originalFit);
     const convertedFit = await convertKrdToFit(krd);

     expect(convertedFit).toMatchRoundTrip(originalFit, {
       timeTolerance: 1, // ±1 second
       powerTolerance: 1, // ±1 watt
     });
   });
   ```

### Test Structure

Use the AAA pattern (Arrange, Act, Assert):

```typescript
it("should do something", () => {
  // Arrange
  const input = createTestData();

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toEqual(expectedOutput);
});
```

## CI/CD Workflows

### Automated Checks

Every pull request triggers automated checks:

1. **Linting**: ESLint and Prettier
2. **Type checking**: TypeScript compilation
3. **Tests**: Full test suite on Node.js 20.x and 22.x
4. **Coverage**: Coverage reports uploaded to Codecov
5. **Build**: Package build verification
6. **Security**: Dependency vulnerability scanning

### Testing Workflows Locally

Use `act` to test GitHub Actions workflows locally:

```bash
# Install act
brew install act

# Test CI workflow
act pull_request -j test

# Test specific job
act pull_request -j lint

# List all jobs
act pull_request -l
```

See [TESTING_WORKFLOWS.md](./.github/TESTING_WORKFLOWS.md) for detailed instructions.

### Required Checks

All checks must pass before a PR can be merged:

- ✅ Linting passes
- ✅ Type checking passes
- ✅ All tests pass
- ✅ Coverage meets threshold (70%)
- ✅ Build succeeds
- ✅ No high/critical security vulnerabilities

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Tests are added/updated and passing
- [ ] Documentation is updated
- [ ] Changeset is added (if applicable)
- [ ] Commit messages follow conventions
- [ ] PR description is clear and complete
- [ ] All CI checks pass

### Pull Request Template

When creating a PR, include:

```markdown
## Description

Brief description of the changes

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Closes #123

## Testing

Describe how you tested your changes

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Changeset added
- [ ] All checks passing
```

### Review Process

1. **Automated checks**: Must pass before review
2. **Code review**: At least one maintainer approval required
3. **Testing**: Reviewer may test changes locally
4. **Feedback**: Address review comments
5. **Approval**: Once approved, PR can be merged

## Release Process

Kaiord uses **Changesets** for automated version management and **package-scoped release tags** to clearly identify which package is being released in our monorepo.

### Package-Scoped Release Tags

Release tags include the package name to provide clear traceability:

- `@kaiord/core@1.2.3` - Core library release
- `@kaiord/cli@0.5.0` - CLI tool release

This format makes it easy to:

- Identify which package a release belongs to
- Filter releases by package
- Track version history per package
- Avoid ambiguity in multi-package releases

### Automated Release Workflow

The release process is fully automated using Changesets and GitHub Actions. Here's how it works:

#### 1. Changeset Creation

Contributors add changesets with their PRs to document changes:

```bash
pnpm exec changeset
```

This interactive command will prompt you to:

1. **Select affected packages**: Choose which packages your changes affect
2. **Choose version bump type**: Select major, minor, or patch
3. **Write a summary**: Describe your changes (will appear in CHANGELOG)

**Example changeset:**

```markdown
---
"@kaiord/core": minor
---

Add support for swimming workouts with pool length and stroke type
```

**When to add a changeset:**

- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Performance improvements
- ❌ Documentation-only changes
- ❌ Test-only changes
- ❌ Internal refactoring with no API changes

#### 2. Version Packages PR

When changesets are merged to `main`, the Changesets GitHub Action automatically:

1. Creates or updates a "Version Packages" PR
2. Bumps versions in `package.json` files
3. Updates `CHANGELOG.md` files with changeset summaries
4. Aggregates multiple changesets if needed

**The PR will:**

- Show all version bumps across packages
- Include complete changelog updates
- Be automatically kept up-to-date as new changesets are merged

**Do not manually edit the "Version Packages" PR** - it's automatically managed by Changesets.

#### 3. Release Publication

When a maintainer merges the "Version Packages" PR:

1. **Tags are created**: Package-scoped tags (e.g., `@kaiord/core@1.2.3`)
2. **Packages are built**: Production builds are generated
3. **Packages are published**: Published to npm with provenance
4. **GitHub releases are created**: With changelog and npm links

**The release workflow:**

- Parses the package-scoped tag to identify which package to publish
- Validates the tag format and package existence
- Verifies version consistency between tag and `package.json`
- Publishes only the specified package (not all packages)
- Creates a GitHub release with package-specific notes
- Includes retry logic with exponential backoff for reliability

### Version Bump Guidelines

**Major (breaking change):** `1.0.0` → `2.0.0`

- Breaking API changes
- Removed features
- Incompatible changes
- Requires users to update their code

**Minor (new feature):** `1.0.0` → `1.1.0`

- New features
- Backward-compatible additions
- New functionality
- No breaking changes

**Patch (bug fix):** `1.0.0` → `1.0.1`

- Bug fixes
- Documentation updates
- Performance improvements
- No API changes

### Manual Release Process

In rare cases, you may need to create a manual release (e.g., hotfix, emergency patch):

#### Prerequisites

1. Ensure you have write access to the repository
2. Ensure the package version in `package.json` is already bumped
3. Ensure `CHANGELOG.md` is updated with release notes

#### Steps

1. **Create the package-scoped tag:**

   ```bash
   # For @kaiord/core
   git tag @kaiord/core@1.2.3

   # For @kaiord/cli
   git tag @kaiord/cli@0.5.0
   ```

2. **Push the tag to trigger the release workflow:**

   ```bash
   # Push specific tag
   git push origin @kaiord/core@1.2.3

   # Or push all tags
   git push --tags
   ```

3. **Monitor the release workflow:**
   - Go to the [Actions tab](https://github.com/pablo-albaladejo/kaiord/actions)
   - Find the "Release" workflow run
   - Verify it completes successfully

4. **Verify the release:**
   - Check [npm](https://www.npmjs.com/package/@kaiord/core) for the new version
   - Check [GitHub Releases](https://github.com/pablo-albaladejo/kaiord/releases) for the release notes

#### Manual Release Examples

**Example 1: Hotfix for core package**

```bash
# 1. Create and checkout hotfix branch
git checkout -b hotfix/core-1.2.4

# 2. Make your fix and commit
git commit -m "fix: resolve critical parsing bug"

# 3. Update version in package.json
cd packages/core
npm version patch  # 1.2.3 → 1.2.4

# 4. Update CHANGELOG.md
# Add entry for 1.2.4 with fix description

# 5. Commit version bump
git commit -am "chore: bump @kaiord/core to 1.2.4"

# 6. Push and merge to main
git push origin hotfix/core-1.2.4
# Create PR and merge

# 7. Create and push tag
git checkout main
git pull
git tag @kaiord/core@1.2.4
git push origin @kaiord/core@1.2.4
```

**Example 2: Pre-release version**

```bash
# 1. Bump to pre-release version
cd packages/core
npm version 2.0.0-beta.1

# 2. Update CHANGELOG.md with beta notes

# 3. Commit and push
git commit -am "chore: bump @kaiord/core to 2.0.0-beta.1"
git push

# 4. Create and push pre-release tag
git tag @kaiord/core@2.0.0-beta.1
git push origin @kaiord/core@2.0.0-beta.1
```

### Viewing Release History

#### Filter releases by package

**Using git:**

```bash
# List all core releases
git tag -l '@kaiord/core@*'

# List all CLI releases
git tag -l '@kaiord/cli@*'

# Show latest tag for each package
git tag -l '@kaiord/core@*' | sort -V | tail -1
git tag -l '@kaiord/cli@*' | sort -V | tail -1
```

**Using GitHub:**

1. Go to [Releases page](https://github.com/pablo-albaladejo/kaiord/releases)
2. Use the search box to filter by package name (e.g., `@kaiord/core`)
3. Or browse tags at [Tags page](https://github.com/pablo-albaladejo/kaiord/tags)

#### View changelog for specific version

```bash
# View changelog for @kaiord/core
cat packages/core/CHANGELOG.md

# View changelog for @kaiord/cli
cat packages/cli/CHANGELOG.md
```

### Troubleshooting Releases

#### Release workflow failed

If the release workflow fails:

1. **Check the workflow logs**: Go to Actions tab and view the failed run
2. **Common issues**:
   - **Invalid tag format**: Ensure tag matches `{packageName}@{version}`
   - **Version mismatch**: Tag version must match `package.json` version
   - **npm authentication**: `NPM_TOKEN` secret may be expired
   - **Network issues**: npm registry may be temporarily unavailable

3. **Fix and retry**:
   - Fix the underlying issue
   - Delete the failed tag: `git tag -d @kaiord/core@1.2.3 && git push origin :refs/tags/@kaiord/core@1.2.3`
   - Create and push the tag again

#### Package not published to npm

If the package didn't publish:

1. **Verify npm credentials**:

   ```bash
   npm whoami --registry https://registry.npmjs.org
   ```

2. **Check npm registry status**: Visit [npm status](https://status.npmjs.org/)

3. **Manual publish** (if workflow failed):

   ```bash
   # Build the package
   pnpm -r build

   # Publish manually
   cd packages/core
   npm publish --access public
   ```

#### GitHub release not created

If the GitHub release wasn't created:

1. Check if the tag exists: `git tag -l '@kaiord/core@*'`
2. Manually create the release:
   - Go to [Releases page](https://github.com/pablo-albaladejo/kaiord/releases)
   - Click "Draft a new release"
   - Select the tag
   - Add release notes from CHANGELOG.md
   - Publish release

#### Tag format validation errors

**Error:** `Invalid tag format`

**Solution:** Ensure tag follows the pattern `{packageName}@{version}`

```bash
# ✅ Correct
@kaiord/core@1.2.3
@kaiord/cli@0.5.0

# ❌ Incorrect
v1.2.3              # Missing package name
core@1.2.3          # Missing scope
@kaiord/core-1.2.3  # Wrong separator (use @ not -)
```

**Error:** `Unknown package`

**Solution:** Ensure package name matches exactly:

- `@kaiord/core` (not `core` or `@kaiord-core`)
- `@kaiord/cli` (not `cli` or `@kaiord-cli`)

**Error:** `Version mismatch`

**Solution:** Ensure tag version matches `package.json`:

```bash
# Check package.json version
node -p "require('./packages/core/package.json').version"

# Tag must match exactly
git tag @kaiord/core@$(node -p "require('./packages/core/package.json').version")
```

### Release Checklist

Before merging "Version Packages" PR:

- [ ] Review version bumps are correct
- [ ] Review CHANGELOG.md entries are accurate
- [ ] Verify all CI checks pass
- [ ] Ensure no breaking changes in minor/patch releases
- [ ] Confirm all related PRs are merged

After release:

- [ ] Verify packages published to npm
- [ ] Verify GitHub releases created
- [ ] Test installation: `npm install @kaiord/core@latest`
- [ ] Announce release (if major/minor)

## Getting Help

If you need help:

1. **Documentation**: Check existing docs in `.github/` and `.kiro/steering/`
2. **Issues**: Search existing issues for similar problems
3. **Discussions**: Use GitHub Discussions for questions
4. **Maintainers**: Tag maintainers in your PR or issue

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Zod Documentation](https://zod.dev)
- [Vitest Documentation](https://vitest.dev)
- [pnpm Documentation](https://pnpm.io)

## License

By contributing to Kaiord, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Kaiord! 🎉
