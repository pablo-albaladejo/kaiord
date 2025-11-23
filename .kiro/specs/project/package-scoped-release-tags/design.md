# Design Document - Package-Scoped Release Tags

## Overview

This design implements package-scoped release tags for the Kaiord monorepo to provide clear traceability and better release management. The current system uses generic version tags (e.g., `v1.2.3`) that don't indicate which package is being released, creating ambiguity in a monorepo with multiple independently versioned packages (`@kaiord/core` and `@kaiord/cli`).

The solution adopts package-scoped tags (e.g., `@kaiord/core@1.2.3`, `@kaiord/cli@0.5.0`) following npm's package naming convention. This approach is supported natively by Changesets and provides clear package identification in git history and GitHub releases.

## Architecture

### Current System

```
┌─────────────────────────────────────────────────────────────┐
│ Developer merges PR with changeset                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Changesets Workflow (on push to main)                       │
│ - Creates/updates "Version Packages" PR                     │
│ - Bumps versions in package.json                            │
│ - Updates CHANGELOG.md                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Maintainer merges "Version Packages" PR                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Changesets creates generic tag: v1.2.3                      │
│ ❌ Problem: Doesn't indicate which package                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Release Workflow (on release published)                     │
│ - Detects version changes by comparing with npm registry    │
│ - Publishes all changed packages                            │
└─────────────────────────────────────────────────────────────┘
```

### Proposed System

```
┌─────────────────────────────────────────────────────────────┐
│ Developer merges PR with changeset                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Changesets Workflow (on push to main)                       │
│ - Creates/updates "Version Packages" PR                     │
│ - Bumps versions in package.json                            │
│ - Updates CHANGELOG.md                                       │
│ - Uses tagFormat: "${packageName}@${version}"               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Maintainer merges "Version Packages" PR                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Changesets creates package-scoped tags:                     │
│ - @kaiord/core@1.2.3                                        │
│ - @kaiord/cli@0.5.0                                         │
│ ✅ Clear package identification                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Release Workflow (on release published)                     │
│ - Parses tag to extract package name and version            │
│ - Validates tag format and package existence                │
│ - Publishes only the specified package                      │
│ - Creates GitHub release with package-specific notes        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Changesets Configuration

**File:** `.changeset/config.json`

**Purpose:** Configure Changesets to use package-scoped tag format

**Changes:**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "tagFormat": "${packageName}@${version}",
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
```

**Key Addition:** `"tagFormat": "${packageName}@${version}"`

This tells Changesets to create tags like `@kaiord/core@1.2.3` instead of `v1.2.3`.

### 2. Release Workflow Enhancement

**File:** `.github/workflows/release.yml`

**Current Trigger:**

```yaml
on:
  release:
    types: [published]
```

**Problem:** Triggers on any release tag without package context

**Proposed Changes:**

#### A. Add Tag Parsing Step

```yaml
- name: Parse release tag
  id: parse-tag
  run: |
    TAG="${{ github.event.release.tag_name }}"
    echo "Full tag: $TAG"

    # Validate tag format: @scope/package@version or package@version
    if [[ ! $TAG =~ ^(@[^/]+/)?[^@]+@[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$ ]]; then
      echo "❌ Invalid tag format: $TAG"
      echo "Expected format: @scope/package@version or package@version"
      echo "Examples: @kaiord/core@1.2.3, @kaiord/cli@0.5.0"
      exit 1
    fi

    # Extract package name and version
    PACKAGE_NAME="${TAG%@*}"
    VERSION="${TAG##*@}"

    echo "package-name=$PACKAGE_NAME" >> $GITHUB_OUTPUT
    echo "version=$VERSION" >> $GITHUB_OUTPUT
    echo "✅ Parsed tag: package=$PACKAGE_NAME, version=$VERSION"
```

#### B. Add Package Validation Step

```yaml
- name: Validate package
  id: validate-package
  run: |
    PACKAGE_NAME="${{ steps.parse-tag.outputs.package-name }}"
    VERSION="${{ steps.parse-tag.outputs.version }}"

    # Determine package directory
    if [[ "$PACKAGE_NAME" == "@kaiord/core" ]]; then
      PACKAGE_DIR="packages/core"
    elif [[ "$PACKAGE_NAME" == "@kaiord/cli" ]]; then
      PACKAGE_DIR="packages/cli"
    else
      echo "❌ Unknown package: $PACKAGE_NAME"
      echo "Valid packages: @kaiord/core, @kaiord/cli"
      exit 1
    fi

    # Verify package directory exists
    if [[ ! -d "$PACKAGE_DIR" ]]; then
      echo "❌ Package directory not found: $PACKAGE_DIR"
      exit 1
    fi

    # Verify package.json version matches tag version
    PACKAGE_VERSION=$(node -p "require('./$PACKAGE_DIR/package.json').version")
    if [[ "$PACKAGE_VERSION" != "$VERSION" ]]; then
      echo "❌ Version mismatch!"
      echo "Tag version: $VERSION"
      echo "package.json version: $PACKAGE_VERSION"
      exit 1
    fi

    echo "package-dir=$PACKAGE_DIR" >> $GITHUB_OUTPUT
    echo "✅ Package validated: $PACKAGE_NAME@$VERSION"
```

#### C. Replace "Detect packages with version changes" Step

**Remove:** Current step that compares with npm registry

**Replace with:** Direct package publishing based on tag

```yaml
- name: Publish package
  id: publish-package
  run: |
    PACKAGE_NAME="${{ steps.parse-tag.outputs.package-name }}"
    VERSION="${{ steps.parse-tag.outputs.version }}"

    echo "Publishing $PACKAGE_NAME@$VERSION..."

    # Retry function with exponential backoff (5s, 10s, 20s)
    retry_publish() {
      local max_attempts=3
      local attempt=1
      local delay=5
      
      while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts..."
        
        if pnpm --filter "$PACKAGE_NAME" publish --access public --no-git-checks --provenance; then
          echo "✅ Successfully published $PACKAGE_NAME@$VERSION"
          return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
          echo "⚠️  Publish failed, retrying in ${delay}s..."
          sleep $delay
          delay=$((delay * 2))
        fi
        
        attempt=$((attempt + 1))
      done
      
      echo "❌ Failed to publish $PACKAGE_NAME after $max_attempts attempts"
      return 1
    }

    retry_publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### D. Update Failure Notification

```yaml
- name: Create failure issue and notify maintainers
  if: failure()
  uses: actions/github-script@v8
  with:
    script: |
      const packageName = '${{ steps.parse-tag.outputs.package-name }}';
      const version = '${{ steps.parse-tag.outputs.version }}';
      const tagName = '${{ github.event.release.tag_name }}';

      const issueBody = `## 🚨 Release Publishing Failed

      **Package:** ${packageName}
      **Version:** ${version}
      **Tag:** ${tagName}
      **Workflow Run:** ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
      **Triggered by:** @${{ github.actor }}
      **Timestamp:** ${new Date().toISOString()}

      ### Error Details

      The release workflow failed while publishing ${packageName}@${version}.

      View complete logs: [Workflow Run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})

      ### Common Causes

      1. **Invalid NPM_TOKEN:** Token expired or lacks publish permissions
      2. **Network Issues:** npm registry temporarily unavailable
      3. **Version Conflict:** Version already published to npm
      4. **Package Configuration:** Invalid package.json or missing files
      5. **Build Artifacts:** Build step failed or produced invalid output

      ### Remediation Steps

      #### 1. Verify NPM Token
      \`\`\`bash
      npm whoami --registry https://registry.npmjs.org
      \`\`\`

      #### 2. Check npm Registry Status
      - Visit: https://status.npmjs.org/

      #### 3. Verify Package Version
      \`\`\`bash
      npm view ${packageName} version
      node -p "require('./${{ steps.validate-package.outputs.package-dir }}/package.json').version"
      \`\`\`

      #### 4. Manual Publishing
      \`\`\`bash
      npm login
      pnpm -r build
      pnpm --filter ${packageName} publish --access public
      \`\`\`

      #### 5. Re-run Workflow
      - Fix identified issues
      - Re-run the [failed workflow](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})

      ### Priority

      🔴 **CRITICAL:** Release is blocked - immediate action required

      ### Notification

      @${{ github.repository_owner }} - Release publishing failed, please investigate.`;

      const issue = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `🚨 Release failed: ${packageName}@${version}`,
        body: issueBody,
        labels: ['release', 'bug', 'automated', 'priority-critical'],
        assignees: [context.repo.owner]
      });

      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.data.number,
        body: `🔔 @${context.repo.owner} - Release workflow failed for ${packageName}@${version}`
      });
```

#### E. Update Summary Step

```yaml
- name: Summary
  if: success()
  run: |
    PACKAGE_NAME="${{ steps.parse-tag.outputs.package-name }}"
    VERSION="${{ steps.parse-tag.outputs.version }}"

    echo "## 📦 Published Package" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "- ✅ $PACKAGE_NAME@$VERSION" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "**npm:** https://www.npmjs.com/package/$PACKAGE_NAME/v/$VERSION" >> $GITHUB_STEP_SUMMARY
```

### 3. Changesets Workflow Enhancement

**File:** `.github/workflows/changesets.yml`

**Current Behavior:** Creates generic release with `v{version}` tag

**Proposed Changes:**

#### A. Update "Create GitHub Release" Step

```yaml
- name: Create GitHub Releases
  if: steps.changesets.outputs.hasChangesets == 'false'
  uses: actions/github-script@v8
  with:
    script: |
      const fs = require('fs');
      const path = require('path');

      // Read package.json files to get versions and changelogs
      const packages = [];

      // Check @kaiord/core
      if (fs.existsSync('packages/core/package.json')) {
        const corePackage = JSON.parse(fs.readFileSync('packages/core/package.json', 'utf8'));
        let coreChangelog = '';
        if (fs.existsSync('packages/core/CHANGELOG.md')) {
          coreChangelog = fs.readFileSync('packages/core/CHANGELOG.md', 'utf8');
        }
        packages.push({
          name: corePackage.name,
          version: corePackage.version,
          changelog: coreChangelog,
          dir: 'packages/core'
        });
      }

      // Check @kaiord/cli
      if (fs.existsSync('packages/cli/package.json')) {
        const cliPackage = JSON.parse(fs.readFileSync('packages/cli/package.json', 'utf8'));
        let cliChangelog = '';
        if (fs.existsSync('packages/cli/CHANGELOG.md')) {
          cliChangelog = fs.readFileSync('packages/cli/CHANGELOG.md', 'utf8');
        }
        packages.push({
          name: cliPackage.name,
          version: cliPackage.version,
          changelog: cliChangelog,
          dir: 'packages/cli'
        });
      }

      if (packages.length === 0) {
        console.log('No packages found to release');
        return;
      }

      // Get the commit that triggered this workflow
      const commit = context.sha;

      // Check which packages were actually updated in this commit
      const { execSync } = require('child_process');
      const changedFiles = execSync(`git diff-tree --no-commit-id --name-only -r ${commit}`, { encoding: 'utf8' });

      const updatedPackages = packages.filter(pkg => {
        const packageJsonPath = `${pkg.dir}/package.json`;
        return changedFiles.includes(packageJsonPath);
      });

      if (updatedPackages.length === 0) {
        console.log('No packages were updated in this commit');
        return;
      }

      console.log(`Creating releases for ${updatedPackages.length} package(s)`);

      // Create a release for each updated package
      for (const pkg of updatedPackages) {
        const tagName = `${pkg.name}@${pkg.version}`;
        
        // Check if release already exists
        try {
          const existingRelease = await github.rest.repos.getReleaseByTag({
            owner: context.repo.owner,
            repo: context.repo.repo,
            tag: tagName
          });
          console.log(`ℹ️ Release ${tagName} already exists: ${existingRelease.data.html_url}`);
          continue;
        } catch (error) {
          if (error.status !== 404) {
            console.error(`Error checking for existing release ${tagName}:`, error);
            throw error;
          }
          // Release doesn't exist, continue to create it
        }

        // Build release notes
        let releaseNotes = `## 📦 ${pkg.name}\n\n`;
        releaseNotes += `**Version:** ${pkg.version}\n`;
        releaseNotes += `**npm:** https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}\n\n`;

        // Add changelog
        if (pkg.changelog) {
          releaseNotes += `## Changelog\n\n`;
          // Extract the latest version section from changelog
          const versionSection = pkg.changelog.split(/^## /m)[1];
          if (versionSection) {
            releaseNotes += versionSection + '\n';
          }
        }

        // Create the release
        try {
          const release = await github.rest.repos.createRelease({
            owner: context.repo.owner,
            repo: context.repo.repo,
            tag_name: tagName,
            name: `${pkg.name} v${pkg.version}`,
            body: releaseNotes,
            draft: false,
            prerelease: false
          });
          
          console.log(`✅ Created release: ${release.data.html_url}`);
        } catch (error) {
          console.error(`Failed to create release for ${tagName}:`, error);
          throw error;
        }
      }
```

## Data Models

### Tag Format

**Pattern:** `{packageName}@{version}`

**Examples:**

- `@kaiord/core@1.2.3`
- `@kaiord/cli@0.5.0`
- `@kaiord/core@2.0.0-beta.1`

**Regex Validation:**

```regex
^(@[^/]+/)?[^@]+@[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$
```

**Components:**

- `(@[^/]+/)?` - Optional scope (e.g., `@kaiord/`)
- `[^@]+` - Package name (e.g., `core`, `cli`)
- `@` - Separator
- `[0-9]+\.[0-9]+\.[0-9]+` - Semantic version (MAJOR.MINOR.PATCH)
- `(-[a-zA-Z0-9.]+)?` - Optional pre-release (e.g., `-beta.1`)
- `(\+[a-zA-Z0-9.]+)?` - Optional build metadata (e.g., `+20130313144700`)

### Package Metadata

```typescript
type PackageMetadata = {
  name: string; // e.g., "@kaiord/core"
  version: string; // e.g., "1.2.3"
  directory: string; // e.g., "packages/core"
  changelog: string; // Content of CHANGELOG.md
};
```

### Release Information

```typescript
type ReleaseInfo = {
  tagName: string; // e.g., "@kaiord/core@1.2.3"
  packageName: string; // e.g., "@kaiord/core"
  version: string; // e.g., "1.2.3"
  releaseTitle: string; // e.g., "@kaiord/core v1.2.3"
  releaseNotes: string; // Formatted changelog
  npmUrl: string; // e.g., "https://www.npmjs.com/package/@kaiord/core/v/1.2.3"
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Tag Format Validation

_For any_ release tag, the tag format must match the pattern `{packageName}@{version}` where packageName is a valid npm package name and version is a valid semantic version.

**Validates: Requirements 1.1, 1.2, 1.3, 9.1, 9.2, 9.4**

**Test Strategy:**

- Generate random valid package names and versions
- Verify tag parsing succeeds and extracts correct components
- Generate invalid tags and verify parsing fails with appropriate error

### Property 2: Package Existence Validation

_For any_ release tag, the package name extracted from the tag must correspond to an existing package directory in the monorepo.

**Validates: Requirements 3.1, 3.2, 3.3, 9.3**

**Test Strategy:**

- Generate tags with valid and invalid package names
- Verify validation succeeds for existing packages
- Verify validation fails for non-existent packages with clear error message

### Property 3: Version Consistency

_For any_ release tag, the version in the tag must exactly match the version in the corresponding package.json file.

**Validates: Requirements 4.4, 4.5**

**Test Strategy:**

- Create test package.json files with various versions
- Generate tags with matching and mismatching versions
- Verify validation succeeds when versions match
- Verify validation fails when versions don't match

### Property 4: Selective Publishing

_For any_ release tag, only the package specified in the tag should be published to npm, and no other packages should be published.

**Validates: Requirements 4.1, 4.2, 4.3**

**Test Strategy:**

- Mock npm publish command
- Trigger release with specific package tag
- Verify publish is called only for the specified package
- Verify publish is not called for other packages

### Property 5: GitHub Release Creation

_For any_ successfully published package, a GitHub release must be created with the package-scoped tag as the release tag.

**Validates: Requirements 5.1, 5.2, 5.3**

**Test Strategy:**

- Mock GitHub API
- Trigger release workflow
- Verify GitHub release is created with correct tag name
- Verify release title includes package name and version
- Verify release notes include package-specific changelog

### Property 6: Multi-Package Release Independence

_For any_ set of simultaneous package releases, each package must be released independently, and failure of one package release must not prevent other packages from being released.

**Validates: Requirements 10.1, 10.2, 10.3**

**Test Strategy:**

- Simulate multiple package releases
- Inject failure for one package
- Verify other packages are still published
- Verify separate GitHub releases are created for each package

### Property 7: Tag Uniqueness

_For any_ package and version combination, only one release tag should exist, and attempting to create a duplicate tag should be prevented.

**Validates: Requirements 6.1, 6.2**

**Test Strategy:**

- Create a release tag
- Attempt to create the same tag again
- Verify duplicate creation is prevented
- Verify appropriate error message is shown

### Property 8: Changelog Extraction

_For any_ package release, the changelog section for the released version must be correctly extracted and included in the GitHub release notes.

**Validates: Requirements 5.4**

**Test Strategy:**

- Create test CHANGELOG.md files with multiple versions
- Extract changelog for specific version
- Verify only the relevant version section is extracted
- Verify formatting is preserved

## Error Handling

### Tag Parsing Errors

**Error:** Invalid tag format

**Cause:** Tag doesn't match expected pattern

**Handling:**

```bash
echo "❌ Invalid tag format: $TAG"
echo "Expected format: @scope/package@version or package@version"
echo "Examples: @kaiord/core@1.2.3, @kaiord/cli@0.5.0"
exit 1
```

**User Impact:** Workflow fails immediately with clear error message

### Package Validation Errors

**Error:** Unknown package

**Cause:** Package name in tag doesn't exist in monorepo

**Handling:**

```bash
echo "❌ Unknown package: $PACKAGE_NAME"
echo "Valid packages: @kaiord/core, @kaiord/cli"
exit 1
```

**User Impact:** Workflow fails with list of valid packages

**Error:** Version mismatch

**Cause:** Tag version doesn't match package.json version

**Handling:**

```bash
echo "❌ Version mismatch!"
echo "Tag version: $VERSION"
echo "package.json version: $PACKAGE_VERSION"
exit 1
```

**User Impact:** Workflow fails with clear comparison of versions

### Publishing Errors

**Error:** npm publish failure

**Cause:** Network issues, authentication failure, or version conflict

**Handling:**

- Retry with exponential backoff (3 attempts)
- Create GitHub issue with detailed error information
- Notify maintainers via issue comment

**User Impact:** Maintainer receives notification and can take corrective action

### GitHub Release Errors

**Error:** Release already exists

**Cause:** Attempting to create duplicate release

**Handling:**

```javascript
console.log(`ℹ️ Release ${tagName} already exists: ${existingRelease.data.html_url}`);
continue; // Skip to next package
```

**User Impact:** Workflow continues without error, logs informational message

## Testing Strategy

### Unit Tests

**Tag Parsing:**

- Test valid tag formats
- Test invalid tag formats
- Test edge cases (pre-release versions, build metadata)

**Package Validation:**

- Test existing packages
- Test non-existent packages
- Test version matching

**Changelog Extraction:**

- Test single version extraction
- Test multiple versions
- Test missing changelog

### Integration Tests

**Changesets Integration:**

- Test changeset creation with new tag format
- Test version bumping
- Test tag creation

**Release Workflow:**

- Test tag parsing in workflow
- Test package validation in workflow
- Test selective publishing

### End-to-End Tests

**Full Release Cycle:**

1. Create changeset
2. Merge "Version Packages" PR
3. Verify package-scoped tags are created
4. Verify GitHub releases are created
5. Verify packages are published to npm

**Multi-Package Release:**

1. Create changesets for multiple packages
2. Merge "Version Packages" PR
3. Verify separate tags for each package
4. Verify separate GitHub releases
5. Verify all packages are published

### Manual Testing

**Dry Run:**

- Test tag format with `git tag` command
- Verify tag appears correctly in git history
- Verify tag can be filtered by package name

**GitHub UI:**

- Verify releases page shows package names
- Verify release notes are formatted correctly
- Verify npm links work

## Migration Strategy

### Phase 1: Configuration Update (Non-Breaking)

1. Update `.changeset/config.json` with `tagFormat`
2. Document new tag format in README
3. No impact on existing releases

### Phase 2: Workflow Update (Breaking Change)

1. Update `.github/workflows/release.yml` with tag parsing
2. Update `.github/workflows/changesets.yml` with package-scoped releases
3. Test with dry-run releases
4. Deploy to production

### Phase 3: Documentation and Communication

1. Update CONTRIBUTING.md with new release process
2. Add migration guide for maintainers
3. Announce change in repository discussions
4. Update release documentation

### Backward Compatibility

- Existing generic tags (`v1.0.0`, `v1.1.0`) remain valid
- Old releases are not modified
- New releases use new format only
- Git history preserves both formats

## Documentation Updates

### README.md

Add section explaining release tags:

````markdown
## Releases

Kaiord uses package-scoped release tags to clearly identify which package is being released:

- `@kaiord/core@1.2.3` - Core library release
- `@kaiord/cli@0.5.0` - CLI tool release

To view releases for a specific package:

```bash
# List all core releases
git tag -l '@kaiord/core@*'

# List all CLI releases
git tag -l '@kaiord/cli@*'
```
````

### CONTRIBUTING.md

Add section on creating releases:

````markdown
## Creating Releases

Releases are automated via Changesets:

1. Create a changeset: `pnpm changeset`
2. Commit and push your changes
3. Changesets will create a "Version Packages" PR
4. Merge the PR to trigger release

The release workflow will:

- Create package-scoped tags (e.g., `@kaiord/core@1.2.3`)
- Publish to npm
- Create GitHub releases with changelog

### Manual Releases

If you need to create a manual release:

```bash
# Create package-scoped tag
git tag @kaiord/core@1.2.3

# Push tag to trigger release
git push origin @kaiord/core@1.2.3
```
````

### DEPLOYMENT.md

Update deployment documentation with new tag format and workflow details.

## Performance Considerations

### Workflow Execution Time

**Current:** ~3-5 minutes per release (all packages)

**Proposed:** ~2-3 minutes per release (single package)

**Improvement:** 33-40% faster due to selective publishing

### Git Operations

**Tag Creation:** No performance impact (same number of tags)

**Tag Filtering:** Improved performance with package-scoped filtering

### npm Publishing

**Current:** Publishes all changed packages

**Proposed:** Publishes only tagged package

**Improvement:** Faster publishing, fewer unnecessary publishes

## Security Considerations

### Tag Validation

- Prevent malicious tag names
- Validate package existence before publishing
- Verify version format to prevent injection attacks

### npm Token

- Continue using `NPM_TOKEN` secret
- No changes to authentication mechanism
- Token scope remains unchanged

### GitHub Permissions

- Workflow requires `contents: write` for tag creation
- Workflow requires `packages: write` for npm publishing
- No additional permissions needed

## Monitoring and Observability

### Workflow Logs

- Log tag parsing results
- Log package validation results
- Log publishing attempts and results
- Log GitHub release creation

### GitHub Issues

- Automatic issue creation on failure
- Include tag name, package name, and version
- Include workflow run URL for debugging
- Notify maintainers via issue comments

### Metrics

- Track release success rate per package
- Track workflow execution time
- Track npm publish retry attempts
- Track GitHub release creation success rate
