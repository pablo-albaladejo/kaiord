# Design Document

## Overview

This design outlines the reorganization of all markdown documentation in the Kaiord repository. The goal is to create a centralized, well-organized documentation structure that is easy to navigate, contains only current information, and uses simple, clear English.

## Architecture

### Current State

Documentation is scattered across multiple locations:

```
kaiord/
├── *.md (8 files in root)
├── .github/*.md (12 files)
├── .github/workflows/*.md (5 files)
├── .kiro/steering/*.md (14 files - keep as-is)
├── .kiro/specs/**/*.md (many files - keep as-is)
├── docs/NEW_FIELDS.md (1 file)
├── packages/core/*.md (5 files)
├── packages/core/docs/*.md (2 files)
├── packages/cli/*.md (3 files)
├── packages/workout-spa-editor/*.md (10+ files)
└── packages/workout-spa-editor/src/**/*.md (many component docs)
```

### Target State

Centralized documentation structure:

```
kaiord/
├── README.md (updated with doc links)
├── CHANGELOG.md (keep)
├── LICENSE (keep)
├── CONTRIBUTING.md (simplified, moved to docs/)
├── docs/
│   ├── README.md (documentation index)
│   ├── getting-started.md (quick start guide)
│   ├── architecture.md (hexagonal architecture, patterns)
│   ├── testing.md (testing guidelines)
│   ├── deployment.md (CI/CD, GitHub Pages, npm publishing)
│   ├── krd-format.md (KRD specification)
│   ├── contributing.md (contribution guidelines)
│   └── agents.md (AI agent guidelines)
├── .kiro/steering/*.md (unchanged - development guidelines)
├── .kiro/specs/**/*.md (unchanged - feature specs)
├── .github/
│   └── pull_request_template.md (only this file)
├── packages/core/
│   ├── README.md (package overview)
│   └── CHANGELOG.md (package changelog)
├── packages/cli/
│   ├── README.md (CLI usage)
│   └── CHANGELOG.md (package changelog)
└── packages/workout-spa-editor/
    ├── README.md (SPA overview)
    └── src/components/**/*.md (component docs - keep co-located)
```

## Components and Interfaces

### Documentation Categories

1. **Getting Started**
   - Installation
   - Quick start
   - Basic usage examples

2. **Architecture**
   - Hexagonal architecture
   - Ports and adapters
   - Use case pattern
   - Zod patterns
   - Error handling

3. **Testing**
   - Unit testing
   - Integration testing
   - Round-trip testing
   - Frontend testing
   - TDD workflow

4. **Deployment**
   - CI/CD workflows
   - GitHub Pages deployment
   - npm publishing (trusted publishing)
   - Local testing

5. **Contributing**
   - Development workflow
   - Code style
   - Commit conventions
   - PR process

6. **Format Specifications**
   - KRD format
   - FIT support
   - TCX support
   - Zwift support

7. **AI Agents**
   - Agent guidelines
   - Kiro integration

## Data Models

### Documentation File Structure

```typescript
type DocumentationFile = {
  path: string; // Relative path from repo root
  title: string; // Document title
  category: DocumentationCategory;
  audience: "developer" | "maintainer" | "contributor" | "user";
  status: "current" | "outdated" | "historical";
  action: "keep" | "move" | "merge" | "delete";
  targetPath?: string; // For move/merge actions
};

type DocumentationCategory =
  | "getting-started"
  | "architecture"
  | "testing"
  | "deployment"
  | "contributing"
  | "format-spec"
  | "agents"
  | "package-specific"
  | "historical";
```

### File Inventory

#### Root Level Files

| File                               | Status     | Action | Target                |
| ---------------------------------- | ---------- | ------ | --------------------- |
| README.md                          | Current    | Keep   | Update with doc links |
| AGENTS.md                          | Current    | Move   | docs/agents.md        |
| CHANGELOG.md                       | Current    | Keep   | -                     |
| CONTRIBUTING.md                    | Current    | Move   | docs/contributing.md  |
| DEPLOYMENT.md                      | Current    | Merge  | docs/deployment.md    |
| CI_BUILD_FIXES.md                  | Historical | Delete | -                     |
| FIT_TO_ZWIFT_CONVERSION_SUMMARY.md | Historical | Delete | -                     |
| QUICK_START_NPM.md                 | Outdated   | Merge  | docs/deployment.md    |
| SHARED_FIXTURES_IMPLEMENTATION.md  | Historical | Delete | -                     |
| THIRD-PARTY-LICENSES.md            | Current    | Keep   | -                     |

#### .github Files

| File                                  | Status     | Action | Target             |
| ------------------------------------- | ---------- | ------ | ------------------ |
| BRANCH_PROTECTION.md                  | Historical | Delete | -                  |
| BRANCH_PROTECTION_VERIFICATION.md     | Historical | Delete | -                  |
| FINAL_SUMMARY.md                      | Historical | Delete | -                  |
| FINAL_VALIDATION.md                   | Historical | Delete | -                  |
| IMPLEMENTATION_COMPLETE.md            | Historical | Delete | -                  |
| NPM_PUBLISHING.md                     | Current    | Merge  | docs/deployment.md |
| NPM_TOKEN_GUIDE.md                    | Current    | Merge  | docs/deployment.md |
| NPM_TRUSTED_PUBLISHING.md             | Current    | Merge  | docs/deployment.md |
| SETUP_CHECKLIST.md                    | Outdated   | Delete | -                  |
| TRUSTED_PUBLISHING_SUMMARY.md         | Historical | Delete | -                  |
| VALIDATION_SUMMARY.md                 | Historical | Delete | -                  |
| pull_request_template.md              | Current    | Keep   | -                  |
| workflows/README.md                   | Current    | Merge  | docs/deployment.md |
| workflows/CACHING.md                  | Historical | Delete | -                  |
| workflows/CLEANUP_SUMMARY.md          | Historical | Delete | -                  |
| workflows/FAILURE_NOTIFICATIONS.md    | Historical | Delete | -                  |
| workflows/PARALLEL_EXECUTION.md       | Historical | Delete | -                  |
| workflows/SECURITY_QUICK_REFERENCE.md | Current    | Merge  | docs/deployment.md |

#### Package Files

| File                                                    | Status     | Action | Target                               |
| ------------------------------------------------------- | ---------- | ------ | ------------------------------------ |
| packages/core/README.md                                 | Current    | Keep   | Simplify, link to main docs          |
| packages/core/CHANGELOG.md                              | Current    | Keep   | -                                    |
| packages/core/KRD_FIXTURES_GENERATION.md                | Current    | Keep   | Technical reference                  |
| packages/core/TREE_SHAKING.md                           | Current    | Keep   | Technical reference                  |
| packages/core/docs/ZWIFT_FORMAT_EXTENSIONS.md           | Current    | Keep   | Format specification                 |
| packages/core/docs/ZWIFT_KAIORD_ATTRIBUTES.md           | Current    | Keep   | Format specification                 |
| packages/cli/README.md                                  | Current    | Keep   | Simplify, link to main docs          |
| packages/cli/CHANGELOG.md                               | Current    | Keep   | -                                    |
| packages/cli/NPM_PUBLISH_VERIFICATION.md                | Current    | Keep   | Technical reference                  |
| packages/workout-spa-editor/README.md                   | Current    | Keep   | Simplify, link to main docs          |
| packages/workout-spa-editor/ARCHITECTURE.md             | Current    | Merge  | docs/architecture.md (SPA section)   |
| packages/workout-spa-editor/CODE_REVIEW_FIXES.md        | Historical | Delete | -                                    |
| packages/workout-spa-editor/DEPLOYMENT.md               | Current    | Merge  | docs/deployment.md (SPA section)     |
| packages/workout-spa-editor/KEYBOARD_SHORTCUTS.md       | Current    | Keep   | User-facing feature doc              |
| packages/workout-spa-editor/KIROWEEN_THEME.md           | Current    | Keep   | User-facing feature doc              |
| packages/workout-spa-editor/MANUAL_TESTING_CHECKLIST.md | Historical | Delete | -                                    |
| packages/workout-spa-editor/TESTING.md                  | Current    | Merge  | docs/testing.md (frontend section)   |
| packages/workout-spa-editor/TESTING_STRATEGY.md         | Current    | Merge  | docs/testing.md (frontend section)   |
| packages/workout-spa-editor/TEST_COVERAGE_SUMMARY.md    | Historical | Delete | -                                    |
| packages/workout-spa-editor/src/PROJECT_STRUCTURE.md    | Current    | Keep   | Technical reference                  |
| packages/workout-spa-editor/src/components/\*_/_.md     | Current    | Keep   | Component documentation (co-located) |

## Correctness Properties

### Property 1: Documentation completeness

_For any_ major feature or component in the codebase, there should exist corresponding documentation in the /docs directory
**Validates: Requirements 1.1, 1.2**

### Property 2: Link validity

_For any_ internal documentation link, the target file should exist at the specified path
**Validates: Requirements 1.4, 7.4**

### Property 3: No duplication

_For any_ piece of information in the documentation, it should appear in exactly one authoritative location
**Validates: Requirements 2.5**

### Property 4: Current information

_For any_ documentation describing features or processes, the content should match the current state of the codebase
**Validates: Requirements 2.2**

### Property 5: Simple language

_For any_ documentation paragraph, the English complexity should not exceed B1 level (CEFR)
**Validates: Requirements 3.1, 3.2**

### Property 6: Consistent structure

_For any_ two package README files, they should follow the same structural template
**Validates: Requirements 9.1, 9.2**

### Property 7: Discoverable from main README

_For any_ documentation file in /docs, there should exist a link to it from the main README
**Validates: Requirements 10.1, 10.5**

## Error Handling

### Missing Files

When moving or merging files:

- Verify source file exists before attempting to move
- Create target directory if it doesn't exist
- Preserve file permissions and metadata

### Broken Links

When updating documentation:

- Scan all markdown files for internal links
- Verify each link target exists
- Update relative paths after file moves
- Report any broken links for manual review

### Content Conflicts

When merging multiple files:

- Identify overlapping content
- Keep most recent and accurate information
- Remove redundant sections
- Preserve unique information from all sources

## Testing Strategy

### Manual Review

1. **Content Accuracy**
   - Read each consolidated document
   - Verify information is current
   - Check for contradictions
   - Ensure completeness

2. **Link Validation**
   - Click every internal link
   - Verify external links are valid
   - Test links in GitHub web interface
   - Test links in local markdown viewers

3. **Language Simplicity**
   - Review for complex vocabulary
   - Check sentence length
   - Verify technical terms are defined
   - Ensure examples are clear

### Automated Checks

1. **Link Checker**

   ```bash
   # Check for broken internal links
   find docs -name "*.md" -exec grep -H "\[.*\](.*)" {} \; | \
     grep -v "http" | \
     # Verify each file path exists
   ```

2. **Duplicate Content**

   ```bash
   # Find similar content across files
   # (manual review of results)
   ```

3. **File Inventory**
   ```bash
   # Verify all files are accounted for
   find . -name "*.md" -not -path "*/node_modules/*" | \
     # Compare against inventory
   ```

## Implementation Plan

### Phase 1: Create New Structure

1. Create /docs directory
2. Create docs/README.md with index
3. Set up documentation categories

### Phase 2: Consolidate Content

1. **Architecture Documentation**
   - Merge .kiro/steering/architecture.md → docs/architecture.md
   - Add SPA architecture from packages/workout-spa-editor/ARCHITECTURE.md
   - Add port-adapter pattern
   - Add use-case pattern
   - Add Zod patterns
   - Add error handling patterns

2. **Testing Documentation**
   - Merge .kiro/steering/testing.md → docs/testing.md
   - Merge .kiro/steering/tdd.md
   - Add frontend testing from packages/workout-spa-editor/TESTING.md
   - Add testing strategy

3. **Deployment Documentation**
   - Merge DEPLOYMENT.md → docs/deployment.md
   - Add CI/CD workflows from .github/workflows/README.md
   - Add npm publishing from .github/NPM_TRUSTED_PUBLISHING.md
   - Add security guidelines
   - Add SPA deployment from packages/workout-spa-editor/DEPLOYMENT.md

4. **Contributing Documentation**
   - Move CONTRIBUTING.md → docs/contributing.md
   - Simplify and clarify
   - Add links to other docs

5. **Format Specification**
   - Move .kiro/steering/krd-format.md → docs/krd-format.md
   - Add supported features
   - Add examples

6. **AI Agents Documentation**
   - Move AGENTS.md → docs/agents.md
   - Keep concise and actionable

7. **Getting Started**
   - Create docs/getting-started.md
   - Extract quick start from README.md
   - Add installation steps
   - Add basic usage examples

### Phase 3: Clean Up

1. Delete historical files
2. Delete outdated files
3. Remove .github documentation (except PR template)
4. Clean up package documentation

### Phase 4: Update Links

1. Update main README.md
2. Update package README files
3. Update .kiro/steering references
4. Update .kiro/specs references
5. Verify all links work

### Phase 5: Validation

1. Manual review of all new docs
2. Link validation
3. Language simplicity check
4. Completeness verification

## Migration Guide

### For Developers

Old documentation locations → New locations:

| Old                                    | New                       |
| -------------------------------------- | ------------------------- |
| AGENTS.md                              | docs/agents.md            |
| CONTRIBUTING.md                        | docs/contributing.md      |
| DEPLOYMENT.md                          | docs/deployment.md        |
| .kiro/steering/architecture.md         | docs/architecture.md      |
| .kiro/steering/testing.md              | docs/testing.md           |
| .kiro/steering/krd-format.md           | docs/krd-format.md        |
| .github/NPM_TRUSTED_PUBLISHING.md      | docs/deployment.md        |
| packages/workout-spa-editor/TESTING.md | docs/testing.md (section) |

### For Maintainers

When adding new documentation:

1. Determine category (architecture, testing, deployment, etc.)
2. Add to appropriate file in /docs
3. Update docs/README.md index
4. Update main README.md if major addition
5. Use simple B1-level English
6. Include code examples
7. Test all links

## Benefits

1. **Easier Navigation**: Single /docs directory with clear categories
2. **No Duplication**: One authoritative source for each topic
3. **Current Information**: Historical and outdated content removed
4. **Simple Language**: B1-level English for accessibility
5. **Consistent Structure**: Same organization across all docs
6. **Discoverable**: All docs linked from main README
7. **Maintainable**: Clear ownership and update process

## Risks and Mitigation

### Risk: Breaking External Links

**Mitigation**:

- Keep CHANGELOG.md and LICENSE in root
- Add redirects in README for moved files
- Document old → new mappings

### Risk: Losing Important Information

**Mitigation**:

- Review all files before deletion
- Preserve unique content when merging
- Keep git history for reference

### Risk: Inconsistent Updates

**Mitigation**:

- Update all references in single PR
- Use automated link checker
- Manual review before merge

## Future Enhancements

1. **Automated Link Checking**: Add CI check for broken links
2. **Documentation Versioning**: Version docs with releases
3. **Search Functionality**: Add documentation search
4. **Internationalization**: Translate docs to other languages
5. **Interactive Examples**: Add runnable code examples
