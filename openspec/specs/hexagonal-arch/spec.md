> Synced: 2026-05-01 (guidelines-compliance-harden)

# Hexagonal Architecture

## Purpose

Hexagonal (ports-and-adapters) layer structure and dependency rules that every package in the monorepo MUST follow so the domain layer stays pure and adapters stay swappable.

## Requirements

### Requirement: Layer Hierarchy

The dependency graph SHALL be: `domain` ← `ports` ← `application` ← `adapters`. No layer MAY import from a layer to its right. The rule SHALL be enforced by `scripts/check-architecture.mjs` under rule ID `R-ArchLeftward`. The script SHALL exclude `*.test.{ts,tsx}`, `*.spec.{ts,tsx}`, `*.stories.{ts,tsx}`, `dist/`, and `node_modules/` from evaluation.

#### Scenario: Upstream import blocked

- **GIVEN** an edit to `packages/core/src/domain/<X>.ts` that imports from `packages/core/src/application/`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code, stderr contains the literal substring `R-ArchLeftward` and the offending file path, and the husky `pre-commit` hook (which runs `pnpm test:scripts`) exits non-zero

### Requirement: Domain Purity

Code in `packages/core/src/domain/` SHALL NOT import from:

- `adapters/`
- `application/`
- `protocol/`
- Any external library outside `DOMAIN_EXTERNAL_ALLOWLIST` (exported from `scripts/architecture.vocab.mjs`; currently `["@noble/hashes", "zod"]`)

Domain contains only pure TypeScript types, Zod schemas, and pure helper functions. Every `DOMAIN_EXTERNAL_ALLOWLIST` entry MUST be pure, isomorphic, and I/O-free; `@noble/hashes` backs `domain/hash/canonical-hash.ts` (the sync SHA-256 used for managed-data identity hashing — `node:crypto` broke browser bundles). Test files (`*.test.{ts,tsx}`) under `packages/core/src/domain/` MAY additionally import the test runner (`vitest`) and the shared fixture loader from `@kaiord/core/test-utils`.

The rule SHALL be enforced by `scripts/check-architecture.mjs`, run as part of `pnpm test:scripts`, the husky `pre-commit` hook, and `pnpm lint`. The rule ID is `R-ArchDomainExt` for external-library violations and `R-ArchLeftward` for cross-layer violations.

#### Scenario: Domain leftward import blocked

- **GIVEN** an edit to `packages/core/src/domain/<X>.ts` (a non-test file) that contains `import { Y } from '../adapters/Z'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code, stderr contains the literal substring `R-ArchLeftward` and the offending file path `packages/core/src/domain/<X>.ts`, and the husky `pre-commit` hook exits non-zero

#### Scenario: Domain external-library violation blocked

- **GIVEN** an edit to `packages/core/src/domain/<X>.ts` (a non-test file) that contains `import { Z } from '@garmin/fitsdk'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains the literal substring `R-ArchDomainExt` and the offending file path

#### Scenario: Allowlisted pure hash library in domain is allowed

- **GIVEN** a file `packages/core/src/domain/hash/<X>.ts` containing `import { sha256 } from '@noble/hashes/sha2'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with code 0 and stderr does NOT contain `R-ArchDomainExt` for this file

### Requirement: Application Isolation

Code in `packages/core/src/application/` SHALL NOT import from:

- `adapters/`
- Any external library

Application contains use cases that depend only on domain types and port interfaces. Test files (`*.test.{ts,tsx}`) under `packages/core/src/application/` MAY additionally import the test runner (`vitest`) and the shared fixture loader from `@kaiord/core/test-utils`.

The rule SHALL be enforced by `scripts/check-architecture.mjs` under rule ID `R-ArchAppPure`. The script SHALL exclude `*.test.{ts,tsx}`, `*.spec.{ts,tsx}`, `*.stories.{ts,tsx}`, `dist/`, and `node_modules/` from evaluation.

#### Scenario: Application import violation blocked

- **GIVEN** an edit to `packages/core/src/application/<X>.ts` (a non-test file) that contains `import { Y } from '@garmin/fitsdk'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains the literal substring `R-ArchAppPure` and the offending file path

#### Scenario: Application test file may import vitest

- **GIVEN** an edit to `packages/core/src/application/<X>.test.ts` containing `import { describe } from 'vitest'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with code 0 and stderr does NOT contain `R-ArchAppPure` for this file

### Requirement: Port Contracts

Code in `packages/core/src/ports/` SHALL define pure type aliases or interfaces. Ports MUST depend only on domain types. Ports MUST NOT contain implementation logic. The rule SHALL be enforced by `scripts/check-architecture.mjs` under rule ID `R-ArchPortPure`. The script SHALL inspect every `.ts`/`.tsx` file under `packages/core/src/ports/` (excluding `*.test.{ts,tsx}`) and reject any AST node that is not one of: `TSTypeAliasDeclaration`, `TSInterfaceDeclaration`, `ImportDeclaration` (importing only from `../domain` or relative siblings), or top-level `export` re-exports of those.

#### Scenario: Port file contains runtime code

- **GIVEN** a file `packages/core/src/ports/<X>.ts` containing a non-type runtime declaration (e.g., `export const FOO = 1` or `export function bar() {}`)
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchPortPure`, the offending file path, and the kind of disallowed AST node found

### Requirement: Adapter Freedom

Adapter packages (`@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) MAY import external libraries. They SHALL depend on `@kaiord/core` (ports + domain) only, never on other adapter packages. The non-format-adapter packages `@kaiord/garmin-connect`, `@kaiord/ai`, `@kaiord/mcp`, `@kaiord/cli`, `@kaiord/workout-spa-editor`, `@kaiord/docs`, `@kaiord/landing`, `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`, `@kaiord/whoop`, `@kaiord/whoop-bridge` are governed by the `Package Dependencies` requirement (rule ID `R-ArchPackageDeps`), not by `R-ArchAdapterCross`. Per the canonical `Package Dependencies` row, `@kaiord/garmin-connect` MAY import `@kaiord/garmin` (the only documented allowance to the format-adapter-isolation principle).

The format-adapter cross-import rule SHALL be enforced by `scripts/check-architecture.mjs` under rule ID `R-ArchAdapterCross`.

#### Scenario: Format adapter cross-import blocked

- **GIVEN** a file `packages/tcx/src/<X>.ts` containing `import { fitReader } from '@kaiord/fit'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchAdapterCross`, the offending file path, and the import specifier `@kaiord/fit`

### Requirement: Strategy Injection

Format conversion SHALL use the strategy pattern. Core use cases (`fromBinary`, `fromText`, `toBinary`, `toText`) accept reader/writer functions as parameters. They MUST NOT hard-code any specific adapter.

#### Scenario: Strategy injection in use case

- **GIVEN** a call to `fromBinary(buffer, fitReader)`
- **WHEN** the reader is swapped to a different adapter
- **THEN** the core use case works identically without code changes

### Requirement: Package Dependencies

Each package SHALL respect the following dependency rules:

| Package                                                       | Allowed Dependencies                                                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@kaiord/core`                                                | No workspace deps (root of the graph)                                                                                        |
| `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` | `@kaiord/core` only                                                                                                          |
| `@kaiord/garmin-connect`                                      | `@kaiord/core`, `@kaiord/garmin`                                                                                             |
| `@kaiord/ai`                                                  | `@kaiord/core` only (+ `ai` as peer dependency; + `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` as optional peers) |
| `@kaiord/mcp`                                                 | `@kaiord/core` + all format adapters + `@kaiord/garmin-connect`                                                              |
| `@kaiord/cli`                                                 | `@kaiord/core` + all adapters + `@kaiord/garmin-connect`                                                                     |
| `@kaiord/workout-spa-editor`                                  | `@kaiord/core`, `@kaiord/ai`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/tcx`, `@kaiord/zwo`                                  |
| `@kaiord/docs`                                                | `@kaiord/core` + all adapters + `@kaiord/garmin-connect` + `@kaiord/cli` + `@kaiord/mcp`                                     |
| `@kaiord/landing`                                             | `@kaiord/core`                                                                                                               |
| `@kaiord/garmin-bridge`                                       | No workspace deps (Chrome extension, communicates via `externally_connectable`)                                              |
| `@kaiord/train2go-bridge`                                     | No workspace deps (Chrome extension, communicates via `externally_connectable`)                                              |
| `@kaiord/whoop`                                               | `@kaiord/core`                                                                                                               |
| `@kaiord/whoop-bridge`                                        | No workspace deps (Chrome extension, communicates via `externally_connectable`)                                              |

#### Scenario: Core declares no workspace dependencies

- **GIVEN** `packages/core/package.json`
- **WHEN** its `dependencies` block is inspected
- **THEN** no `@kaiord/*` workspace package appears

#### Scenario: AI package declares its provider SDKs as optional peers

- **GIVEN** `packages/ai/package.json`
- **WHEN** its `peerDependencies` and `peerDependenciesMeta` blocks are inspected
- **THEN** `@ai-sdk/anthropic`, `@ai-sdk/openai`, and `@ai-sdk/google` appear as peers marked
  optional, and none of them appears in `dependencies`

### Requirement: Architecture mechanical guard exists

The repository SHALL contain `scripts/check-architecture.mjs` that statically inspects every TypeScript and TSX source file under `packages/*/src/` (excluding `*.test.{ts,tsx}`, `*.spec.{ts,tsx}`, `*.stories.{ts,tsx}`, `dist/`, and `node_modules/`) and rejects any import declaration violating the layer rules in this spec. The script SHALL be tested by a co-located `scripts/check-architecture.test.mjs` using `node:test`, executed as part of `pnpm test:scripts`. The script SHALL be wired into the husky `pre-commit` hook (after the `pnpm test:scripts` step) and `pnpm lint`.

The script SHALL implement at minimum these rules:

| Rule ID                      | Forbids                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R-ArchLeftward`             | `packages/core/src/domain/**` importing `application/`, `adapters/`, or `ports/`; `packages/core/src/ports/**` importing `application/` or `adapters/`; `packages/core/src/application/**` importing `adapters/`                |
| `R-ArchDomainExt`            | `packages/core/src/domain/**` or `packages/core/src/protocol/**` importing any external library outside `DOMAIN_EXTERNAL_ALLOWLIST` (`zod`, `@noble/hashes`)                                                                    |
| `R-ArchAppPure`              | `packages/core/src/application/**` importing any external library                                                                                                                                                               |
| `R-ArchPortPure`             | `packages/core/src/ports/**` containing any AST node other than type aliases, interfaces, or re-exports of the same                                                                                                             |
| `R-ArchAdapterCross`         | `packages/{fit,tcx,zwo,garmin}/src/**` importing from a sibling format adapter (`@kaiord/{fit,tcx,zwo,garmin}` other than the package's own). Cross-package imports beyond format adapters are governed by `R-ArchPackageDeps`. |
| `R-ArchCoreAdapterAllowlist` | any folder under `packages/core/src/adapters/` whose name is not `logger` or `analytics`                                                                                                                                        |
| `R-ArchCoreSrcDirs`          | any top-level directory under `packages/core/src/` not enumerated in `CORE_SRC_ALLOWLIST` (`adapters`, `application`, `domain`, `ports`, `protocol`, `test-utils`, `tests`)                                                     |
| `R-ArchCoreAmbientTypes`     | any `*.d.ts` under `packages/core/src/` containing `declare module "<external-package>"` for a vendor SDK                                                                                                                       |

The `{logger, analytics}` allowlist used by `R-ArchCoreAdapterAllowlist` SHALL live in a single source-of-truth module `scripts/architecture.vocab.mjs` exporting `CORE_ADAPTER_ALLOWLIST = ["analytics", "logger"]`. The same array SHALL be reproduced verbatim inside a fenced block in `.claude/skills/guidelines/architecture-hexagonal/SKILL.md` between the markers `<!-- arch-vocab:start -->` and `<!-- arch-vocab:end -->`. The test in `scripts/check-architecture.test.mjs` SHALL parse the SKILL.md block, import `architecture.vocab.mjs`, and assert array equality (order-sensitive). Drift between doc and code MUST fail CI.

The script SHALL recognize import declarations only — JSDoc-only references (`@kaiord/fit` mentioned inside `/** ... */` blocks) MUST NOT trigger violations.

The script MAY maintain a hard-coded `ALLOWLIST` Set for documenting controlled escape hatches. The production `ALLOWLIST` MUST be empty before this change is archived; allowlist entries are accepted only with reviewer-gated justifications, mirroring the comment-block convention in `scripts/check-no-pii-leakage.mjs` (each entry MUST carry an inline comment naming the rule ID, the offending file, and the planned drain PR).

When the script reports a violation, the failure message SHALL include: (a) the rule ID, (b) the absolute or repo-relative offending file path, (c) the offending import specifier, and (d) for `R-ArchCoreAdapterAllowlist`, a hint pointing the contributor to create `packages/<name>/` instead.

#### Scenario: garmin-connect importing garmin is allowed

- **GIVEN** a file `packages/garmin-connect/src/X.ts` containing `import { gcnReader } from '@kaiord/garmin'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with code 0 and stderr does NOT contain `R-ArchAdapterCross` for this file

#### Scenario: New adapter folder under core is rejected

- **GIVEN** a directory `packages/core/src/adapters/storage/` containing any `.ts` file
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchCoreAdapterAllowlist`, the offending directory name `storage`, and the suggested fix `create packages/storage/ instead`

#### Scenario: Drift between architecture-hexagonal SKILL.md and architecture.vocab.mjs

- **GIVEN** a contributor adds `"cache"` to `scripts/architecture.vocab.mjs` `CORE_ADAPTER_ALLOWLIST` without updating the `<!-- arch-vocab -->` block in `.claude/skills/guidelines/architecture-hexagonal/SKILL.md`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `scripts/check-architecture.test.mjs` fails with a message naming the diverging entry and the two file paths

#### Scenario: Ambient module declaration in core is rejected

- **GIVEN** a file `packages/core/src/types/X.d.ts` containing `declare module "@vendor/sdk" { ... }`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchCoreAmbientTypes` and the file path

### Requirement: Core adapter allowlist

`packages/core/src/adapters/` SHALL contain only the subfolders enumerated in `CORE_ADAPTER_ALLOWLIST` exported from `scripts/architecture.vocab.mjs`. The current allowlist is `["analytics", "logger"]`. Both house infrastructure-free, zero-runtime-dependency adapters that ship with `@kaiord/core` for ergonomic defaults. No other category of adapter SHALL live in core; new adapter categories MUST live in their own `@kaiord/<name>` package.

This requirement aligns the `architecture-hexagonal` guideline document with the active `analytics-port` capability spec (which mandates `@kaiord/core/adapters/analytics`). Both `logger` and `analytics` are zero-dep noop-by-default adapters; they are exempt from the "external libraries forbidden in core" rule because they have none.

#### Scenario: Allowlist matches the code

- **WHEN** the architecture check inspects the direct subfolders of `packages/core/src/adapters/`
- **THEN** the listing equals exactly `CORE_ADAPTER_ALLOWLIST` from `scripts/architecture.vocab.mjs` — no more, no fewer

#### Scenario: New core adapter category attempted

- **GIVEN** the allowlist is `{logger, analytics}` and a contributor adds `packages/core/src/adapters/cache/X.ts`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchCoreAdapterAllowlist` and the suggested fix `create packages/cache/ instead`

### Requirement: Core source directory allowlist

`packages/core/src/` SHALL contain only the top-level directories enumerated in `CORE_SRC_ALLOWLIST` exported from `scripts/architecture.vocab.mjs`. The current allowlist is `["adapters", "application", "domain", "ports", "protocol", "test-utils", "tests"]`. Undeclared directories escape every per-layer rule (the per-file checks classify files by their top-level directory name), so they are rejected outright by `scripts/check-architecture.mjs` under rule ID `R-ArchCoreSrcDirs`. Loose files directly under `packages/core/src/` (e.g., `index.ts`) are not affected.

The `protocol/` layer holds cross-package protocol contracts (DTO schemas shared between the SPA and browser-extension bridges, e.g. the Profile Snapshot). It SHALL be governed by the same rules as `domain/`: no imports from `ports/`, `application/`, or `adapters/`, and no external libraries outside `DOMAIN_EXTERNAL_ALLOWLIST`. `domain/` SHALL NOT import from `protocol/` — the two are independent leaves.

#### Scenario: Undeclared core/src directory rejected

- **GIVEN** a directory `packages/core/src/cache/` containing any `.ts` file
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchCoreSrcDirs`, the offending directory name `cache`, and a hint to move the code into a governed layer or declare the new layer in `scripts/architecture.vocab.mjs`

#### Scenario: Protocol layer governed like domain

- **GIVEN** a file `packages/core/src/protocol/<X>.ts` containing `import { parse } from 'fast-xml-parser'`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchDomainExt` and the offending file path

### Requirement: Vendor SDK ambient types live in their adapter package

Any `*.d.ts` file declaring an external vendor SDK module (`declare module "@<vendor>/<sdk>"`) SHALL live in the package that consumes that SDK, never in `packages/core/`. For example, `garmin-fitsdk.d.ts` (declaring `@garmin/fitsdk`) SHALL live under `packages/fit/src/types/`, not `packages/core/src/types/`.

The `packages/core/src/` tree SHALL NOT contain a top-level `types/` folder; type declarations specific to core's own domain MUST live alongside their consumers under `domain/`, `ports/`, `application/`, or `adapters/`. Cross-package protocol contracts (e.g., the SPA ↔ bridge Profile Snapshot DTO) live in the dedicated `protocol/` layer, governed by the same purity rules as `domain/`.

#### Scenario: Vendor ambient declaration in core is moved on PR

- **GIVEN** `packages/core/src/types/garmin-fitsdk.d.ts` exists containing `declare module "@garmin/fitsdk"`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchCoreAmbientTypes`, the offending file path, and the suggested fix `move the file to packages/fit/src/types/garmin-fitsdk.d.ts`

### Requirement: Package dependency table is mechanically enforced

The repository SHALL contain `scripts/check-package-deps.mjs` (+ co-located `*.test.mjs`) that reads every `packages/*/package.json` and rejects any `dependencies` or `devDependencies` entry whose name starts with `@kaiord/` and is not on the allowlist for that package, where the allowlist is the existing `Package Dependencies` requirement table in this spec. The rule ID is `R-ArchPackageDeps`. The script SHALL be wired into `pnpm test:scripts` and `pnpm lint`.

The allowlist (codified in the script as a `PACKAGE_DEPS` constant, byte-identical to the `Package Dependencies` requirement in this spec):

| Package                                                                    | Allowed `@kaiord/*` deps                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `@kaiord/core`                                                             | _(none)_                                                                                    |
| `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`              | `@kaiord/core`                                                                              |
| `@kaiord/garmin-connect`                                                   | `@kaiord/core`, `@kaiord/garmin`                                                            |
| `@kaiord/ai`                                                               | `@kaiord/core`                                                                              |
| `@kaiord/mcp`                                                              | `@kaiord/core` + all format adapters + `@kaiord/garmin-connect`                             |
| `@kaiord/cli`                                                              | `@kaiord/core` + all adapters + `@kaiord/garmin-connect`                                    |
| `@kaiord/workout-spa-editor`                                               | `@kaiord/core`, `@kaiord/ai`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/tcx`, `@kaiord/zwo` |
| `@kaiord/docs`                                                             | `@kaiord/core` + all adapters + `@kaiord/garmin-connect` + `@kaiord/cli` + `@kaiord/mcp`    |
| `@kaiord/landing`                                                          | `@kaiord/core`                                                                              |
| `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`, `@kaiord/whoop-bridge` | _(none — Chrome extensions)_                                                                |

#### Scenario: Disallowed workspace dep blocked

- **GIVEN** a contributor adds `"@kaiord/tcx": "*"` to `packages/fit/package.json` `dependencies`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ArchPackageDeps`, the offending package, and the disallowed dep name
