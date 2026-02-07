---
name: check-deps
description: Analyze dependencies for optimization, security, and architecture compliance
---

# Check Dependencies

Analyze dependencies across the monorepo for optimization opportunities, security issues, and best practices.

## What this skill does

1. **Find unused dependencies** in each package
2. **Detect duplicate dependencies** across packages (candidates for workspace)
3. **Check for outdated packages** with available updates
4. **Identify heavy dependencies** that could be replaced
5. **Find security vulnerabilities** using npm audit
6. **Validate dependency boundaries** (hexagonal architecture)

## How to use

Check all packages:

```
/check-deps
```

Check specific package:

```
/check-deps packages/core
```

Quick security check only:

```
/check-deps --security
```

## Analysis Areas

### 1. Unused Dependencies

For each `package.json`:

- Parse all TypeScript source files
- Extract actual imports used
- Compare with dependencies listed
- Report any that are declared but never imported

**Example Output:**

```markdown
### @kaiord/fit - Unused Dependencies:

None found ✅

### @kaiord/core - Unused Dependencies:

⚠️ moment (declared but never imported)
Action: pnpm remove moment --filter @kaiord/core
```

### 2. Duplicate Dependencies

Identify dependencies that appear in multiple packages:

```markdown
### Duplicate Dependencies Across Packages:

fast-xml-parser:

- @kaiord/tcx: ^4.3.2
- @kaiord/zwo: ^4.3.2
  ✅ Suggestion: Move to workspace dependencies

zod:

- @kaiord/core: ^3.22.4
- @kaiord/fit: ^3.22.4
- @kaiord/tcx: ^3.22.4
  ✅ Suggestion: Already in workspace dependencies, ensure consistent versioning
```

### 3. Heavy Dependencies

Flag dependencies over certain size thresholds:

```markdown
### Heavy Dependencies:

@kaiord/fit:

- garmin-fitsdk (2.3MB) - ⚠️ Required for FIT binary parsing
  Note: This is the official Garmin SDK, necessary for format support

@kaiord/tcx:

- fast-xml-parser (180KB) - ✅ Acceptable
```

### 4. Outdated Packages

Check for available updates:

```bash
pnpm outdated
```

Report format:

```markdown
### Outdated Packages:

@kaiord/core:

- typescript: 5.3.3 → 5.4.2 (patch available)
- vitest: 1.2.0 → 1.4.0 (minor available)

Action: Review changelog and update if safe
```

### 5. Security Vulnerabilities

Run npm audit and report:

```markdown
### Security Audit:

✅ No vulnerabilities found

Or:

⚠️ 2 moderate vulnerabilities found:

- semver: Prototype Pollution
  Path: @kaiord/cli > dependency-chain > semver
  Action: Update to 7.5.4 or later
```

### 6. Architecture Validation

Ensure dependency boundaries are respected:

```markdown
### Architecture Compliance:

✅ @kaiord/core - No external dependencies (domain layer)
✅ @kaiord/fit - Depends only on @kaiord/core
✅ @kaiord/tcx - Depends only on @kaiord/core
✅ @kaiord/zwo - Depends only on @kaiord/core
❌ @kaiord/cli - Should not import adapters directly

Violation found:
packages/cli/src/commands/convert/index.ts:
import { fitToKRD } from '@kaiord/fit'

Fix: Use createDefaultProviders pattern with adapter providers
```

## Implementation Steps

1. For each package in `packages/`:
   - Read `package.json`
   - Find all `.ts` files in `src/`
   - Extract imports using regex or TypeScript AST
   - Cross-reference with declared dependencies

2. Check for duplicates:
   - Build map of dependency → packages using it
   - Report any used in 2+ packages

3. Run security audit:

   ```bash
   pnpm audit --audit-level=moderate
   ```

4. Validate architecture:
   - Check that `@kaiord/core` has no external dependencies
   - Check that adapter packages only depend on `@kaiord/core`
   - Check that `@kaiord/cli` uses providers, not direct imports

## Report Format

````markdown
# Dependency Analysis Report - Kaiord Monorepo

Generated: 2026-02-07

## Summary

- ✅ 0 unused dependencies
- ✅ 0 security vulnerabilities
- ⚠️ 2 duplicate dependencies (optimization opportunity)
- ✅ Architecture boundaries respected

## Detailed Analysis

### Package: @kaiord/core

Status: ✅ CLEAN
Dependencies: 2

- zod: ^3.22.4 (✅ used)
- typescript: ^5.3.3 (✅ used)

### Package: @kaiord/fit

Status: ✅ CLEAN
Dependencies: 3

- @kaiord/core: workspace:\* (✅ used)
- garmin-fitsdk: ^1.0.0 (✅ used)
- zod: ^3.22.4 (⚠️ duplicate - use from core)

[... continue for each package]

## Recommendations

1. **Consolidate zod version**: Use workspace dependency
2. **Update typescript**: 5.3.3 → 5.4.2 available
3. **No action needed**: Architecture compliance ✅

## Next Steps

```bash
# Apply recommended changes
pnpm add -D zod@^3.22.4 -w
pnpm remove zod --filter @kaiord/fit
pnpm install
```
````

```

## Integration with Development Cycle

This skill should be run:
- ✅ Before creating a PR (automated via git hook)
- ✅ After adding any new dependency
- ✅ Weekly as part of maintenance
- ✅ Before major releases

Add to `.claude/hooks/pre-pr.ts` for automation.
```
