# Implementation Plan - Package-Scoped Release Tags

- [x] 1. Update Changesets configuration
  - Add `tagFormat` property to `.changeset/config.json`
  - Set value to `"${packageName}@${version}"`
  - Verify configuration is valid JSON
  - _Requirements: 2.1, 2.2_

- [x] 2. Create tag parsing utility script
  - Create `scripts/parse-release-tag.sh` for tag validation and parsing
  - Implement regex validation for tag format
  - Extract package name and version from tag
  - Return error codes for invalid tags
  - Add usage documentation in script comments
  - _Requirements: 3.1, 3.2, 3.3, 9.1, 9.2, 9.4_

- [x] 2.1 Write unit tests for tag parsing
  - Test valid tag formats (@kaiord/core@1.2.3, @kaiord/cli@0.5.0)
  - Test invalid tag formats (v1.2.3, core@1.2.3, @kaiord/core-1.2.3)
  - Test edge cases (pre-release versions, build metadata)
  - Test extraction of package name and version
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 3. Create package validation utility script
  - Create `scripts/validate-package.sh` for package validation
  - Verify package directory exists
  - Verify package.json exists and is valid
  - Compare tag version with package.json version
  - Return error codes for validation failures
  - _Requirements: 4.4, 4.5, 9.3_

- [x] 3.1 Write unit tests for package validation
  - Test validation with existing packages
  - Test validation with non-existent packages
  - Test version matching scenarios
  - Test version mismatch scenarios
  - _Requirements: 4.4, 4.5, 9.3_

- [x] 4. Update release workflow with tag parsing
  - Add "Parse release tag" step to `.github/workflows/release.yml`
  - Use `scripts/parse-release-tag.sh` to extract package info
  - Set GitHub Actions outputs for package-name and version
  - Add error handling for invalid tags
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Update release workflow with package validation
  - Add "Validate package" step to `.github/workflows/release.yml`
  - Use `scripts/validate-package.sh` to verify package
  - Determine package directory based on package name
  - Verify version consistency between tag and package.json
  - Set GitHub Actions output for package-dir
  - _Requirements: 4.4, 4.5, 9.3_

- [x] 6. Update release workflow with selective publishing
  - Replace "Detect packages with version changes" step
  - Remove separate publish steps for core and CLI
  - Add single "Publish package" step using parsed package name
  - Use pnpm --filter with dynamic package name
  - Maintain retry logic with exponential backoff
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Update release workflow failure notifications
  - Update "Create failure issue" step with package-specific details
  - Include package name and version in issue title
  - Include tag name in issue body
  - Update error messages to reference specific package
  - Update notification to mention specific package
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 8. Update release workflow summary
  - Update "Summary" step to show single published package
  - Include package name and version
  - Add npm package URL to summary
  - Remove logic for multiple packages
  - _Requirements: 11.4_

- [x] 9. Update changesets workflow for package-scoped releases
  - Update "Create GitHub Release" step in `.github/workflows/changesets.yml`
  - Detect which packages were updated in the commit
  - Create separate release for each updated package
  - Use package-scoped tag format for each release
  - Include package name in release title
  - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.4_

- [x] 10. Implement changelog extraction logic
  - Add logic to extract version-specific changelog section
  - Parse CHANGELOG.md to find relevant version
  - Extract content between version headers
  - Include extracted content in GitHub release notes
  - Handle missing changelog gracefully
  - _Requirements: 5.4_

- [x] 10.1 Write unit tests for changelog extraction
  - Test extraction with single version
  - Test extraction with multiple versions
  - Test extraction with missing changelog
  - Test extraction with malformed changelog
  - _Requirements: 5.4_

- [x] 11. Add npm package URL to release notes
  - Generate npm package URL from package name and version
  - Include URL in GitHub release body
  - Format URL as markdown link
  - _Requirements: 5.5, 11.4_

- [x] 12. Implement multi-package release support
  - Ensure changesets workflow processes multiple packages independently
  - Create separate tags for each package
  - Create separate GitHub releases for each package
  - Handle failures independently (continue on error)
  - Log summary of all published packages
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Update README.md with release tag documentation
  - Add "Releases" section explaining package-scoped tags
  - Provide examples of tag format
  - Document how to view releases per package
  - Document how to filter tags by package
  - _Requirements: 8.1, 8.2_

- [x] 14. Update CONTRIBUTING.md with release process
  - Document automated release process with changesets
  - Explain package-scoped tag creation
  - Provide manual release instructions
  - Include examples of creating and pushing tags
  - _Requirements: 8.2, 8.3_

- [x] 15. Update DEPLOYMENT.md with new workflow details
  - Document new release workflow steps
  - Explain tag parsing and validation
  - Document selective publishing behavior
  - Include troubleshooting section
  - _Requirements: 8.4_

- [x] 16. Create release CLI helper script (optional)
  - Create `scripts/create-release.sh` for manual releases
  - Accept package name and version as arguments
  - Validate inputs before creating tag
  - Create and push tag to remote
  - Add dry-run option for preview
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 16.1 Write unit tests for release CLI script
  - Test with valid package names and versions
  - Test with invalid inputs
  - Test dry-run mode
  - Test tag creation and push
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 17. Checkpoint - Test with dry-run release
  - Create test changeset for @kaiord/core
  - Merge "Version Packages" PR in test branch
  - Verify package-scoped tag is created
  - Verify tag format is correct
  - Verify GitHub release is created with correct format
  - Do NOT publish to npm (dry-run only)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Write integration tests for release workflow
  - Test tag parsing step with various tag formats
  - Test package validation step with valid/invalid packages
  - Test selective publishing with mocked npm publish
  - Test failure notification with mocked GitHub API
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 19. Write integration tests for changesets workflow
  - Test GitHub release creation with mocked API
  - Test multi-package release scenario
  - Test changelog extraction and formatting
  - Test duplicate release handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.1, 10.2, 10.3_

- [x] 20. Write end-to-end tests for full release cycle
  - Test complete flow from changeset to npm publish
  - Test multi-package release with both core and CLI
  - Test failure scenarios and recovery
  - Test backward compatibility with existing tags
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_

- [x] 21. Final Checkpoint - Production release test
  - Create real changeset for minor version bump
  - Merge "Version Packages" PR
  - Verify package-scoped tags are created
  - Verify packages are published to npm
  - Verify GitHub releases are created correctly
  - Verify npm package pages show new versions
  - Ensure all tests pass, ask the user if questions arise.
