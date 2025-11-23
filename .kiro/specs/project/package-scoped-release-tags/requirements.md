# Requirements Document - Package-Scoped Release Tags

## Introduction

This document defines the requirements for implementing package-scoped release tags in the Kaiord monorepo. Currently, releases use generic version tags (e.g., `v1.2.3`) that don't indicate which package is being released. This creates ambiguity in a monorepo with multiple independently versioned packages. The solution is to adopt package-scoped tags (e.g., `@kaiord/core@1.2.3`, `@kaiord/cli@0.5.0`) to provide clear traceability and better release management.

## Glossary

- **Release Tag**: Git tag created when publishing a new version of a package
- **Package-Scoped Tag**: Tag that includes the package name as a prefix (e.g., `@kaiord/core@1.2.3`)
- **Generic Tag**: Tag without package prefix (e.g., `v1.2.3`)
- **Changesets**: Tool for managing versioning and changelogs in monorepos
- **Tag Format**: Pattern used to generate release tags from package name and version
- **Monorepo**: Single repository containing multiple independently versioned packages
- **Release Workflow**: GitHub Actions workflow that publishes packages to npm
- **Version Packages PR**: Pull request created by changesets to bump versions
- **npm Registry**: Package registry where npm packages are published
- **GitHub Release**: GitHub feature for documenting releases with notes and assets

## Requirements

### Requirement 1: Package-Scoped Tag Format

**User Story:** As a maintainer, I want release tags to include the package name, so that I can immediately identify which package a release belongs to.

#### Acceptance Criteria

1. WHEN a package version is bumped, THE Release System SHALL generate a tag with format `{packageName}@{version}`
2. WHEN @kaiord/core version 1.2.3 is released, THE Release System SHALL create tag `@kaiord/core@1.2.3`
3. WHEN @kaiord/cli version 0.5.0 is released, THE Release System SHALL create tag `@kaiord/cli@0.5.0`
4. THE Release System SHALL NOT create generic version tags like `v1.2.3`
5. THE Release System SHALL support scoped package names with `@` symbol in tags

### Requirement 2: Changesets Configuration Update

**User Story:** As a developer, I want changesets to automatically use package-scoped tags, so that the release process is consistent and automated.

#### Acceptance Criteria

1. THE Changesets Configuration SHALL include `tagFormat` property set to `${packageName}@${version}`
2. WHEN changesets creates a release, THE Changesets Tool SHALL use the configured tag format
3. WHEN multiple packages are released simultaneously, THE Changesets Tool SHALL create separate tags for each package
4. THE Changesets Configuration SHALL maintain backward compatibility with existing changesets
5. THE Changesets Configuration SHALL validate tag format before creating releases

### Requirement 3: Release Workflow Tag Detection

**User Story:** As a CI/CD system, I want to detect which package is being released from the tag name, so that I can publish only the relevant package.

#### Acceptance Criteria

1. WHEN a release tag is pushed, THE Release Workflow SHALL parse the tag to extract package name and version
2. WHEN tag `@kaiord/core@1.2.3` is pushed, THE Release Workflow SHALL identify package as `@kaiord/core` and version as `1.2.3`
3. WHEN tag `@kaiord/cli@0.5.0` is pushed, THE Release Workflow SHALL identify package as `@kaiord/cli` and version as `0.5.0`
4. IF tag format is invalid or doesn't match pattern, THEN THE Release Workflow SHALL fail with clear error message
5. THE Release Workflow SHALL publish only the package specified in the tag

### Requirement 4: Selective Package Publishing

**User Story:** As a maintainer, I want only the tagged package to be published, so that unrelated packages are not unnecessarily published.

#### Acceptance Criteria

1. WHEN tag `@kaiord/core@1.2.3` triggers release workflow, THE Release Workflow SHALL publish only @kaiord/core
2. WHEN tag `@kaiord/cli@0.5.0` triggers release workflow, THE Release Workflow SHALL publish only @kaiord/cli
3. THE Release Workflow SHALL NOT publish packages that are not specified in the release tag
4. THE Release Workflow SHALL verify that the package version in package.json matches the tag version
5. IF package version doesn't match tag version, THEN THE Release Workflow SHALL fail with validation error

### Requirement 5: GitHub Release Creation

**User Story:** As a repository visitor, I want GitHub releases to clearly show which package was released, so that I can find relevant release notes easily.

#### Acceptance Criteria

1. WHEN a package is published, THE Release Workflow SHALL create a GitHub release with the package-scoped tag
2. WHEN @kaiord/core@1.2.3 is published, THE GitHub Release SHALL have title "@kaiord/core v1.2.3"
3. WHEN @kaiord/cli@0.5.0 is published, THE GitHub Release SHALL have title "@kaiord/cli v0.5.0"
4. THE GitHub Release SHALL include changelog entries specific to the released package
5. THE GitHub Release SHALL include a link to the npm package page

### Requirement 6: Release History Traceability

**User Story:** As a maintainer, I want to easily view release history per package, so that I can track version progression and changes over time.

#### Acceptance Criteria

1. WHEN viewing git tags, THE Tag List SHALL clearly show which package each release belongs to
2. WHEN filtering tags by package name, THE Git System SHALL return only tags for that specific package
3. WHEN viewing GitHub releases page, THE Release List SHALL allow filtering by package name
4. THE Release System SHALL maintain chronological order of releases across all packages
5. THE Release System SHALL support querying latest release per package

### Requirement 7: Backward Compatibility

**User Story:** As a maintainer, I want existing releases and tags to remain valid, so that the migration doesn't break historical references.

#### Acceptance Criteria

1. THE Release System SHALL preserve all existing generic version tags (e.g., `v1.0.0`, `v1.1.0`)
2. THE Release System SHALL NOT delete or modify existing tags during migration
3. THE Release System SHALL support both old and new tag formats in git history
4. THE Documentation SHALL explain the tag format change and migration timeline
5. THE Release System SHALL use new tag format only for releases created after migration

### Requirement 8: Documentation Updates

**User Story:** As a contributor, I want clear documentation on the new tag format, so that I understand how releases work in the monorepo.

#### Acceptance Criteria

1. THE Documentation SHALL explain the package-scoped tag format with examples
2. THE Documentation SHALL provide instructions for creating manual releases with correct tags
3. THE Documentation SHALL document how to query releases for a specific package
4. THE Documentation SHALL include troubleshooting guide for common tag-related issues
5. THE Documentation SHALL explain the difference between old and new tag formats

### Requirement 9: Tag Validation

**User Story:** As a CI/CD system, I want to validate release tags before processing, so that invalid tags are rejected early with clear error messages.

#### Acceptance Criteria

1. WHEN a release tag is pushed, THE Release Workflow SHALL validate tag format matches `{packageName}@{version}`
2. WHEN tag format is invalid, THE Release Workflow SHALL fail with error message explaining expected format
3. WHEN package name in tag doesn't exist in monorepo, THE Release Workflow SHALL fail with error listing valid packages
4. WHEN version in tag doesn't match semantic versioning, THE Release Workflow SHALL fail with error explaining version format
5. THE Release Workflow SHALL log validation results for debugging purposes

### Requirement 10: Multi-Package Release Support

**User Story:** As a maintainer, I want to release multiple packages simultaneously when needed, so that coordinated releases are possible.

#### Acceptance Criteria

1. WHEN multiple packages have version bumps in same commit, THE Changesets Tool SHALL create separate tags for each package
2. WHEN multiple tags are pushed simultaneously, THE Release Workflow SHALL process each tag independently
3. WHEN one package fails to publish, THE Release Workflow SHALL continue publishing other packages
4. THE Release Workflow SHALL create separate GitHub releases for each published package
5. THE Release Workflow SHALL report summary of all published packages in workflow output

### Requirement 11: Release Notification Enhancement

**User Story:** As a maintainer, I want release notifications to specify which package was released, so that I can quickly understand what changed.

#### Acceptance Criteria

1. WHEN a package is successfully published, THE Release Workflow SHALL include package name in success notification
2. WHEN a package fails to publish, THE Release Workflow SHALL include package name in failure notification
3. WHEN creating GitHub issue for failed release, THE Issue Title SHALL include package name
4. THE Notification SHALL include direct link to the published npm package
5. THE Notification SHALL include changelog excerpt for the released version

### Requirement 12: CLI Release Command

**User Story:** As a maintainer, I want a CLI command to create releases with correct tags, so that manual releases follow the same format as automated ones.

#### Acceptance Criteria

1. THE Project SHALL provide a script or command for creating manual releases
2. WHEN running release command with package name and version, THE Command SHALL create correctly formatted tag
3. WHEN running release command, THE Command SHALL validate package exists and version is valid
4. WHEN running release command, THE Command SHALL push tag to remote repository
5. THE Command SHALL provide dry-run option to preview tag without creating it
