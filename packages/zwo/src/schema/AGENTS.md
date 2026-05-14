<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/schema/

## Purpose

Bundled ZWO XSD schema. Contains the Zwift Workout XML schema definition used for validation. Symlinked from repository root and copied to `dist/schema/` during build (`postbuild` script).

## Key Files

| File                | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `zwift-workout.xsd` | Official Zwift Workout XML Schema Definition (XSD) for validation |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Schema location**: Primary source is at `schema/zwift-workout.xsd` (repository root). Build script copies it here during `postbuild`.
- **Validation usage**: Loaded by `xsd-schema-validator.ts` in Node.js environments; unused in browsers.
- **Build artifact**: Schema copied to `dist/schema/` and distributed with npm package.

### Testing Requirements

None. Schema file is static; no tests required.

### Common Patterns

- Schema path resolution in Node.js validators:
  ```typescript
  const schemaPath = require.resolve("@kaiord/zwo/schema/zwift-workout.xsd");
  ```

## Dependencies

None. This is a static asset.

<!-- MANUAL: -->
