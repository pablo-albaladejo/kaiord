# @kaiord/fit

## 7.1.1

### Patch Changes

- 4fc4308: Internal build + CI hardening release. No public API changes, no runtime behavior changes.
  - **TypeScript 6.0.3**: toolchain migrated from TS 5.9.3 across all packages. Consumers can now opt into TS 6 without hitting `baseUrl` deprecation warnings in shipped type declarations.
  - **Dedupe vite to 8.x**: removed the dual-vite-major state in the lockfile (vite 7.3 was coming in via vitepress alpha). `pnpm.overrides` forces a single major.
  - **Dependabot sweep**: @garmin/fitsdk 21.200→21.201, vitest 4.1.4→4.1.5, tailwindcss 4.2.2→4.2.4, lucide-react 1.8→1.11, vue 3.5.32→3.5.33, ora 9.3→9.4, @codecov/vite-plugin 1.9→2.0, @fission-ai/openspec 1.3.0→1.3.1, plus 3 GitHub Actions version bumps.
  - **CI hardening**: Link-checker is now a required status check + lychee pinned to v0.24; `enforce_admins` enabled on main branch protection; CHANGELOG.md excluded from cspell; `pnpm-lock.yaml` excluded from prettier (eliminates a recurring push-time reformat loop).
  - **Build watchdog**: `scripts/check-tsup-ignoredeprecations.mjs` auto-fails lint the day tsup fixes [egoist/tsup#1388](https://github.com/egoist/tsup/issues/1388), so the repo self-heals to drop the last remaining `ignoreDeprecations` silencer without manual tracking.

  No API additions, removals, or behavioral changes. Published packages consume the same surface as 7.0.0.

- Updated dependencies [4fc4308]
  - @kaiord/core@7.1.1

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0

## 4.8.1

### Patch Changes

- 2bb0ffd: Internal: lint fixes, vitest config, and type import cleanup across adapter packages

## 4.7.2

### Patch Changes

- 2377eaa: Update production dependencies: @garmin/fitsdk 21.194.0, fast-xml-parser 5.3.6

## 4.7.1

### Patch Changes

- a4cb756: Fix zone validation for power and pace targets during FIT import

## 4.5.3

### Patch Changes

- 6cc9ccb: Add comprehensive unit tests for target converters, duration converters, workout converters, and CLI utilities to close coverage gaps

## 4.3.0

### Minor Changes

- 3cea716: feat(mcp): add MCP server package exposing Kaiord tools to AI agents
  - New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
  - Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
  - Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation

### Patch Changes

- Updated dependencies [3cea716]
  - @kaiord/core@4.3.0

## 4.1.3

### Patch Changes

- 74edc44: Update package description to reflect health & fitness data framework branding
- Updated dependencies [74edc44]
  - @kaiord/core@4.1.3

## 4.0.0

### Major Changes

- d3fa555: BREAKING: Rename KRD types for explicit separation (workout -> structured_workout, activity -> recorded_activity)

  This is a breaking change to the KRD format schema:
  - **Type field values changed**: `"workout"` -> `"structured_workout"`, `"activity"` -> `"recorded_activity"`
  - **Extension key renamed**: `extensions.workout` -> `extensions.structured_workout`
  - **Metadata field removed**: `metadata.fileType` removed (redundant with root `type`)
  - **Event types prefixed**: All event types now use `event_` prefix (e.g., `"start"` -> `"event_start"`, `"workout_step"` -> `"event_workout_step_change"`)
  - **Activity data relocated**: Recorded activity data (sessions, laps, records, events) moved from `extensions.recorded_activity` to top-level KRD fields

  Old KRD files will need to be re-exported. No backward compatibility migration is provided.

### Patch Changes

- Updated dependencies [d3fa555]
  - @kaiord/core@4.0.0

## 3.0.0

### Major Changes

- 9cfdf44: Extract format adapters from @kaiord/core into separate packages for modular installation.

  Breaking changes:
  - `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
  - Provider properties for adapters are now optional (undefined when adapter not installed)
  - Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

  New packages:
  - `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
  - `@kaiord/tcx` - TCX format adapter with fast-xml-parser
  - `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
  - `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

  Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.

### Patch Changes

- 9cfdf44: Consolidate test fixtures to shared monorepo location
  - Moved all test fixtures to `/test-fixtures/` directory
  - Updated fixture loaders in @kaiord/core/test-utils
  - Removed fixture duplication across adapter packages
  - Fixed @kaiord/core to not publish fixtures to npm
  - Reduced package sizes by ~120KB

- Updated dependencies [9cfdf44]
- Updated dependencies [9cfdf44]
  - @kaiord/core@3.0.0

## 2.0.1

### Patch Changes

- 0a756dd: feat: add Node.js 24 Active LTS support

  Add comprehensive Node.js 24.x (Active LTS) support to all packages and CI workflows while maintaining backward compatibility with Node.js 20.x and 22.x.

  **Changes:**
  - Add Node.js 24.x to CI test matrices (lint, test, test-frontend)
  - Upgrade @types/node from ^20.11.0 to ^24.0.0 across all packages
  - Update deployment workflows to use Node.js 24.x (release, deploy-spa-editor, security)
  - Update documentation to recommend Node.js 24.x as the preferred version
  - Maintain Node.js >=20.0.0 engine requirement for backward compatibility

  **Breaking Changes:** None

- Updated dependencies [0a756dd]
  - @kaiord/core@2.0.1

## 2.0.0

### Major Changes

- dcc0cac: Extract format adapters from @kaiord/core into separate packages for modular installation.

  Breaking changes:
  - `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
  - Provider properties for adapters are now optional (undefined when adapter not installed)
  - Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

  New packages:
  - `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
  - `@kaiord/tcx` - TCX format adapter with fast-xml-parser
  - `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
  - `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

  Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.

### Patch Changes

- Updated dependencies [dcc0cac]
  - @kaiord/core@2.0.0
