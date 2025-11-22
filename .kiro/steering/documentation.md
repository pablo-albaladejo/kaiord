# Documentation Organization

## Principles

Documentation in Kaiord follows a clear separation between user-facing content and development process documentation.

## Directory Structure

### `/docs` - User-Facing Documentation

**Purpose**: Documentation for end users and developers using Kaiord

**Content**:

- User guides (getting started, usage examples)
- API documentation (KRD format specification)
- Developer guides (architecture, testing, deployment)
- Contributing guidelines

**Rules**:

- ✅ **DO** include: User guides, API docs, architecture patterns, testing strategies
- ❌ **DON'T** include: Migration guides, historical notes, implementation logs, process documentation

**Structure**:

```
docs/
├── README.md              # Simple index, no migration history
├── getting-started.md     # For users
├── krd-format.md          # For users
├── architecture.md        # For developers
├── testing.md             # For developers
└── deployment.md          # For developers
```

### Root-Level Documentation Files

**Convention**: Certain documentation files belong in the repository root by convention:

- `README.md` - Project overview and quick start
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history
- `LICENSE` - License information
- `AGENTS.md` - AI agent guidelines

**Why**: These files are standard across open-source projects and expected in the root.

### `.kiro/specs/` - Feature Specifications

**Purpose**: Spec-driven development documentation

**Content**:

- Requirements documents
- Design documents
- Task lists
- Implementation notes

**Rules**:

- Keep all spec-related content here
- Never move to `/docs` - this is process documentation

### `.kiro/steering/` - Development Guidelines

**Purpose**: Guidelines for AI agents and developers

**Content**:

- Architecture patterns
- Code style rules
- Testing patterns
- Workflow guidelines

**Rules**:

- Keep all steering rules here
- These guide development but aren't user-facing

### Package Documentation

**Location**: `packages/*/README.md` + `packages/*/docs/`

**README.md (Public npm documentation)**:

- Package overview
- Installation instructions
- Quick usage examples
- API reference
- Links to detailed documentation
- **High quality** - this is what users see on npm

**packages/\*/docs/ (Technical documentation)**:

- Implementation details
- Technical references
- Development guides
- Package-specific architecture

**Rules**:

- README.md is public-facing, high-quality npm documentation
- Technical docs go in `packages/*/docs/`
- Link from README to technical docs when needed
- Don't duplicate content from main `/docs`

## What NOT to Include in `/docs`

### ❌ Migration Guides

**Bad**:

```markdown
## Documentation Migration

If you're looking for documentation that was previously in other locations...

### Old → New Location Mappings

| Old Location | New Location |
```

**Why**: Users don't care about internal reorganization history.

### ❌ Historical Implementation Notes

**Bad**:

```markdown
## Implementation History

- 2024-01-15: Implemented FIT converter
- 2024-01-20: Fixed power target bug
```

**Why**: Git history provides this information. Documentation should describe current state.

### ❌ Process Documentation

**Bad**:

```markdown
## How We Organized This Documentation

We moved files from X to Y because...
```

**Why**: Internal process decisions aren't relevant to users.

### ❌ Temporary Technical Notes

**Bad**:

- `NEW_FIELDS.md` - Implementation notes about adding fields
- `MIGRATION_GUIDE.md` - How to migrate from old structure
- `REFACTORING_NOTES.md` - Notes about code refactoring

**Why**: These are development artifacts, not user documentation.

## What TO Include in `/docs`

### ✅ User Guides

**Good**:

````markdown
# Getting Started

Install Kaiord:

```bash
npm install @kaiord/core
```
````

Convert a FIT file:

```typescript
import { convertFitToKrd } from "@kaiord/core";
```

````

**Why**: Helps users accomplish tasks.

### ✅ API Documentation

**Good**:
```markdown
# KRD Format Specification

## Workout Object

The `workout` object represents a structured workout...
````

**Why**: Describes what the software does and how to use it.

### ✅ Architecture Guides

**Good**:

```markdown
# Architecture

Kaiord follows hexagonal architecture...

## Ports & Adapters

Ports define contracts...
```

**Why**: Helps developers understand and contribute to the codebase.

## Documentation Index (`docs/README.md`)

### ✅ Good Index

```markdown
# Kaiord Documentation

## Documentation Index

### For Users

- [Getting Started](getting-started.md)
- [KRD Format](krd-format.md)

### For Developers

- [Architecture](architecture.md)
- [Testing](testing.md)
```

**Characteristics**:

- Simple and clear
- Organized by audience
- Direct links to content
- No migration history
- No process documentation

### ❌ Bad Index

```markdown
# Kaiord Documentation

## Documentation Migration

If you're looking for documentation that was previously...

### Old → New Location Mappings

...

### Why Files Were Deleted

...
```

**Problems**:

- Focuses on internal process
- Confuses users with history
- Clutters the index

## Maintenance Rules

### When Adding Documentation

1. **Determine audience**: User or developer?
2. **Choose location**:
   - User-facing → `/docs`
   - Development process → `.kiro/specs/` or `.kiro/steering/`
   - Package-specific → `packages/*/README.md`
3. **Update index**: Add to `docs/README.md` if in `/docs`
4. **Link from main README**: If major addition

### When Removing Documentation

1. **Don't document the removal** in user-facing docs
2. **Don't add migration guides** to `/docs/README.md`
3. **Git history** is sufficient for tracking changes

### When Reorganizing Documentation

1. **Update links** in all affected files
2. **Don't add migration sections** to user docs
3. **Keep it simple** - users care about current state, not history

## Examples

### ✅ Good: User-Facing Documentation

```
docs/
├── README.md              # Simple index
├── getting-started.md     # How to use Kaiord
├── krd-format.md          # KRD specification
├── architecture.md        # How Kaiord is built
├── testing.md             # How to test
└── deployment.md          # How to deploy
```

### ❌ Bad: Mixed with Process Documentation

```
docs/
├── README.md              # Index with migration history
├── getting-started.md
├── krd-format.md
├── NEW_FIELDS.md          # ❌ Implementation notes
├── MIGRATION_GUIDE.md     # ❌ Internal process
└── REFACTORING_NOTES.md   # ❌ Development artifact
```

## Package README Quality Standards

### Critical: README.md is Public npm Documentation

Package README files (`packages/*/README.md`) are **public-facing documentation** that appears on npm. They must be:

- ✅ **High quality** - Clear, professional, well-formatted
- ✅ **Complete** - Installation, usage, API reference
- ✅ **Accurate** - Up-to-date with current implementation
- ✅ **Concise** - Quick to scan, easy to understand
- ✅ **Well-linked** - Point to detailed docs when needed

### README Structure (Required)

Every package README MUST include:

1. **Title** - Package name with scope (`# @kaiord/core`)
2. **Description** - One-line package description
3. **Installation** - npm/pnpm install commands
4. **Quick Usage** - Basic code examples
5. **Documentation** - Links to main docs and package-specific docs
6. **Scripts** - Available npm scripts (for development)
7. **License** - License information

### Technical Documentation Location

Technical implementation details go in `packages/*/docs/`:

- ✅ `packages/core/docs/tree-shaking.md` - Technical guide
- ✅ `packages/core/docs/krd-fixtures-generation.md` - Implementation details
- ✅ `packages/cli/docs/npm-publish-verification.md` - Publishing checklist
- ✅ `packages/workout-spa-editor/docs/keyboard-shortcuts.md` - Feature documentation

### File Naming Convention

All documentation files MUST use **kebab-case**:

- ✅ `tree-shaking.md` (not `TREE_SHAKING.md`)
- ✅ `krd-fixtures-generation.md` (not `KRD_FIXTURES_GENERATION.md`)
- ✅ `npm-publish-verification.md` (not `NPM_PUBLISH_VERIFICATION.md`)
- ✅ `keyboard-shortcuts.md` (not `KEYBOARD_SHORTCUTS.md`)

### Linking Strategy

**From README to technical docs:**

```markdown
See [docs/tree-shaking.md](./docs/tree-shaking.md) for detailed guide.
```

**From README to main docs:**

```markdown
See [Architecture](../../docs/architecture.md) for system design.
```

## Summary

- **`/docs`** = User-facing documentation only
- **Root** = Standard files by convention (`README.md`, `CONTRIBUTING.md`, `AGENTS.md`, etc.)
- **`packages/*/README.md`** = **Public npm documentation** (high quality required)
- **`packages/*/docs/`** = Technical/implementation documentation
- **`.kiro/specs/`** = Feature specifications and implementation notes
- **`.kiro/steering/`** = Development guidelines
- **No migration guides** in user-facing documentation
- **No historical notes** in user-facing documentation
- **Keep it simple** - document current state, not process
- **Use kebab-case** for all documentation file names
