# Implementation Plan

- [x] 1. Create documentation structure
  - [x] 1.1 Create /docs directory
    - Create docs/ folder at repository root
    - _Requirements: 1.1_

  - [x] 1.2 Create documentation index
    - Create docs/README.md with table of contents
    - List all documentation files with descriptions
    - Organize by category (getting started, architecture, testing, deployment, contributing, format specs, agents)
    - _Requirements: 7.2, 7.3_

- [x] 2. Create getting-started documentation
  - [x] 2.1 Write docs/getting-started.md
    - Extract quick start content from main README.md
    - Add installation instructions (Node.js, pnpm)
    - Add basic usage examples (library and CLI)
    - Add links to detailed documentation
    - Use simple B1-level English
    - _Requirements: 3.1, 3.2, 4.2_

- [x] 3. Consolidate architecture documentation
  - [x] 3.1 Create docs/architecture.md
    - Copy content from .kiro/steering/architecture.md
    - Add hexagonal architecture overview
    - Add ports and adapters pattern
    - Add use case pattern from .kiro/steering/use-case-pattern.md
    - Add Zod patterns from .kiro/steering/zod-patterns.md
    - Add error handling from .kiro/steering/error-patterns.md
    - Add SPA architecture section from packages/workout-spa-editor/ARCHITECTURE.md
    - Use simple language and code examples
    - _Requirements: 2.5, 3.3, 4.1_

- [x] 4. Consolidate testing documentation
  - [x] 4.1 Create docs/testing.md
    - Copy content from .kiro/steering/testing.md
    - Add TDD workflow from .kiro/steering/tdd.md
    - Add frontend testing section from packages/workout-spa-editor/TESTING.md
    - Add testing strategy from packages/workout-spa-editor/TESTING_STRATEGY.md
    - Remove duplicate content
    - Add clear examples for each testing type
    - _Requirements: 2.5, 3.3, 4.1_

- [x] 5. Consolidate deployment documentation
  - [x] 5.1 Create docs/deployment.md
    - Copy CI/CD overview from DEPLOYMENT.md
    - Add GitHub Pages deployment section
    - Add npm publishing section from .github/NPM_TRUSTED_PUBLISHING.md
    - Add token-based publishing from .github/NPM_TOKEN_GUIDE.md
    - Add workflow documentation from .github/workflows/README.md
    - Add security guidelines from .github/workflows/SECURITY_QUICK_REFERENCE.md
    - Add SPA deployment section from packages/workout-spa-editor/DEPLOYMENT.md
    - Remove outdated QUICK_START_NPM.md content
    - Organize in clear sections with examples
    - _Requirements: 2.2, 2.5, 4.3_

- [x] 7. Create format specification documentation
  - [x] 7.1 Create docs/krd-format.md
    - Move .kiro/steering/krd-format.md to docs/krd-format.md
    - Add supported FIT fields section
    - Add examples for each field type
    - Add links to Zwift format extensions
    - Keep technical but clear
    - _Requirements: 4.3_

- [x] 8. Create AI agents documentation
  - [x] 8.1 Move docs/agents.md
    - Move AGENTS.md to docs/agents.md
    - Keep concise and actionable
    - Ensure consistency with other docs
    - _Requirements: 4.1_

- [x] 9. Delete historical and outdated files
  - [x] 9.1 Delete root-level historical files
    - Delete CI_BUILD_FIXES.md
    - Delete FIT_TO_ZWIFT_CONVERSION_SUMMARY.md
    - Delete SHARED_FIXTURES_IMPLEMENTATION.md
    - Delete QUICK_START_NPM.md (content merged to docs/deployment.md)
    - _Requirements: 2.1, 2.3, 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Delete .github historical files
    - Delete .github/BRANCH_PROTECTION.md
    - Delete .github/BRANCH_PROTECTION_VERIFICATION.md
    - Delete .github/FINAL_SUMMARY.md
    - Delete .github/FINAL_VALIDATION.md
    - Delete .github/IMPLEMENTATION_COMPLETE.md
    - Delete .github/NPM_PUBLISHING.md (content merged)
    - Delete .github/NPM_TOKEN_GUIDE.md (content merged)
    - Delete .github/NPM_TRUSTED_PUBLISHING.md (content merged)
    - Delete .github/SETUP_CHECKLIST.md
    - Delete .github/TRUSTED_PUBLISHING_SUMMARY.md
    - Delete .github/VALIDATION_SUMMARY.md
    - Keep .github/pull_request_template.md
    - _Requirements: 2.1, 2.3, 5.1, 5.2, 5.3_

  - [x] 9.3 Delete .github/workflows historical files
    - Delete .github/workflows/CACHING.md
    - Delete .github/workflows/CLEANUP_SUMMARY.md
    - Delete .github/workflows/FAILURE_NOTIFICATIONS.md
    - Delete .github/workflows/PARALLEL_EXECUTION.md
    - Delete .github/workflows/README.md (content merged)
    - Delete .github/workflows/SECURITY_QUICK_REFERENCE.md (content merged)
    - _Requirements: 2.1, 2.3, 5.4_

  - [x] 9.4 Delete package historical files
    - Delete packages/workout-spa-editor/CODE_REVIEW_FIXES.md
    - Delete packages/workout-spa-editor/MANUAL_TESTING_CHECKLIST.md
    - Delete packages/workout-spa-editor/TEST_COVERAGE_SUMMARY.md
    - Delete packages/workout-spa-editor/TESTING.md (content merged)
    - Delete packages/workout-spa-editor/TESTING_STRATEGY.md (content merged)
    - Delete packages/workout-spa-editor/DEPLOYMENT.md (content merged)
    - Delete packages/workout-spa-editor/ARCHITECTURE.md (content merged)
    - _Requirements: 2.1, 2.3, 8.5_

- [x] 10. Update package README files
  - [x] 10.1 Simplify packages/core/README.md
    - Keep package overview and installation
    - Add quick usage example
    - Add link to docs/architecture.md for architecture details
    - Add link to docs/testing.md for testing guidelines
    - Add link to docs/krd-format.md for format specification
    - Remove duplicate content
    - _Requirements: 6.1, 6.2, 9.2_

  - [x] 10.2 Simplify packages/cli/README.md
    - Keep CLI usage and commands
    - Add installation instructions
    - Add usage examples
    - Add link to docs/getting-started.md
    - Add link to docs/krd-format.md
    - Remove duplicate content
    - _Requirements: 6.1, 6.2, 9.2_

  - [x] 10.3 Simplify packages/workout-spa-editor/README.md
    - Keep SPA overview and features
    - Add link to live demo
    - Add link to docs/architecture.md for architecture
    - Add link to docs/testing.md for testing
    - Add link to docs/deployment.md for deployment
    - Keep KEYBOARD_SHORTCUTS.md and KIROWEEN_THEME.md (user-facing)
    - Remove duplicate content
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.2_

- [x] 11. Update main README.md
  - [x] 11.1 Add documentation section to README.md
    - Add "Documentation" section after "Features"
    - Link to docs/getting-started.md
    - Link to docs/architecture.md
    - Link to docs/testing.md
    - Link to docs/deployment.md
    - Link to docs/contributing.md
    - Link to docs/krd-format.md
    - Link to docs/agents.md
    - Use clear descriptions for each link
    - _Requirements: 7.1, 10.1, 10.2, 10.5_

  - [x] 11.2 Update existing README sections
    - Update "Documentation" references to point to /docs
    - Remove outdated links
    - Simplify quick start (link to docs/getting-started.md)
    - Update CI/CD section to link to docs/deployment.md
    - Update contributing section to link to docs/contributing.md
    - _Requirements: 10.3, 10.4_

- [x] 12. Update internal documentation links
  - [x] 12.1 Update .kiro/steering references
    - Scan all .kiro/steering/\*.md files for links to moved docs
    - Update links to point to new /docs locations
    - Verify all links work
    - _Requirements: 1.4, 7.4_

  - [x] 12.2 Update .kiro/specs references
    - Scan all .kiro/specs/\*_/_.md files for links to moved docs
    - Update links to point to new /docs locations
    - Verify all links work
    - _Requirements: 1.4, 7.4_

  - [x] 12.3 Update package documentation links
    - Update links in packages/core/README.md
    - Update links in packages/cli/README.md
    - Update links in packages/workout-spa-editor/README.md
    - Update links in component documentation
    - Verify all links work
    - _Requirements: 1.4, 7.4_

- [-] 13. Validate documentation
  - [x] 13.1 Manual content review
    - Read each new documentation file
    - Verify information is current and accurate
    - Check for contradictions
    - Ensure completeness
    - Verify language is B1 level
    - _Requirements: 2.2, 3.1_

  - [x] 13.2 Link validation
    - Click every internal link in /docs
    - Verify external links are valid
    - Test links in GitHub web interface
    - Fix any broken links
    - _Requirements: 1.4, 7.4_

  - [x] 13.3 Structure consistency check
    - Verify all package READMEs follow same structure
    - Verify all /docs files have consistent formatting
    - Verify naming conventions are consistent
    - _Requirements: 7.3, 9.1_

  - [x] 13.4 Completeness verification
    - Verify all major features have documentation
    - Verify all moved content is accounted for
    - Verify no important information was lost
    - Verify docs/README.md index is complete
    - _Requirements: 2.4, 7.2_

- [x] 14. Final cleanup
  - [x] 14.1 Remove old documentation references
    - Search codebase for references to deleted files
    - Update or remove outdated references
    - Verify no broken links remain
    - _Requirements: 10.3_

  - [x] 14.2 Update CHANGELOG.md
    - Add entry for documentation reorganization
    - List major changes (centralized docs, removed historical files)
    - Note migration guide in docs/README.md
    - _Requirements: 10.2_

  - [x] 14.3 Create migration guide
    - Add "Documentation Migration" section to docs/README.md
    - List old → new file mappings
    - Provide guidance for finding moved content
    - _Requirements: 10.4_
