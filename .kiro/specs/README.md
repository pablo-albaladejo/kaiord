# Kaiord Specs Organization

This directory contains all feature specifications organized by package and scope.

## Structure

```
.kiro/specs/
├── core/                    # @kaiord/core package specs
├── workout-spa-editor/      # workout-spa-editor package specs
└── project/                 # Project-wide specs (CI/CD, docs, etc.)
```

## Package: core

Specs for the `@kaiord/core` library (workout data conversion and validation).

- `fit-compliance-enhancements/` - FIT format compliance improvements
- `fit-to-krd-conversion/` - FIT to KRD conversion implementation
- `port-adapter-refactor/` - Port-Adapter pattern refactoring
- `zod-schema-migration/` - Migration to Zod schemas

## Package: workout-spa-editor

Specs for the Workout SPA Editor (React application).

**Implementation Order (v1.0.0 - v1.1.0):**

1. `00-mvp/` - ✅ v1.0.0 MVP (COMPLETE)
2. `01-import-export/` - v1.1.0 Import/Export FIT/TCX/ZWO (HIGH, 15-20h)
3. `02-repetition-blocks/` - v1.1.0 Repetition Blocks (MEDIUM, 10-12h)
4. `03-error-handling/` - v1.1.0 Enhanced Error Handling (MEDIUM, 6-8h)
5. `04-drag-drop/` - v1.1.0 Drag-and-Drop Reordering (MEDIUM, 8-10h)
6. `05-copy-paste/` - v1.1.0 Copy/Paste Functionality (LOW, 6-8h)
7. `06-delete-undo/` - v1.1.0 Delete with Undo (LOW, 4-6h)
8. `99-advanced/` - v1.2.0+ Advanced Features (Future, 40-60h)

## Project: project-wide

Specs that affect the entire monorepo.

- `cli-package/` - CLI package implementation
- `github-actions-cicd/` - CI/CD pipeline setup
- `npm-package-documentation/` - Package documentation

## Naming Convention

- **Numbered specs** (00-99): Indicate implementation order
  - `00-` = MVP/Foundation
  - `01-06` = v1.1.0 features (in priority order)
  - `99-` = Future/Advanced features
- **Named specs**: No specific order, implement as needed

## Getting Started

To start implementing a feature:

1. Navigate to the spec directory (e.g., `.kiro/specs/workout-spa-editor/01-import-export/`)
2. Read `requirements.md` for acceptance criteria
3. Review `design.md` for architecture and approach
4. Open `tasks.md` and click "Start task" on the first task
