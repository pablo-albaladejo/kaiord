---
name: optimize-imports
description: Refactor imports for better tree-shaking and smaller bundles
---

# Optimize Imports

Automatically refactor imports across the codebase for better tree-shaking and smaller bundles.

## What this skill does

1. **Convert wildcard imports** to named imports
2. **Remove unused imports** across all files
3. **Consolidate duplicate imports** from the same module
4. **Separate type imports** for better tree-shaking

## How to use

Optimize all imports in the project:
```
/optimize-imports
```

Optimize a specific package:
```
/optimize-imports packages/fit
```

Optimize a single file:
```
/optimize-imports packages/fit/src/adapters/krd-to-fit.converter.ts
```

## Transformations

### 1. Wildcard to Named Imports

**Before:**
```typescript
import * as z from 'zod'

const schema = z.object({ name: z.string() })
```

**After:**
```typescript
import { object, string } from 'zod'

const schema = object({ name: string() })
```

### 2. Separate Type Imports

**Before:**
```typescript
import { KRD, toKRD, fromKRD } from '@kaiord/core'
```

**After:**
```typescript
import type { KRD } from '@kaiord/core'
import { toKRD, fromKRD } from '@kaiord/core'
```

### 3. Remove Unused Imports

**Before:**
```typescript
import { map, filter, reduce, sortBy } from 'lodash-es'

const result = map(data, fn)
```

**After:**
```typescript
import { map } from 'lodash-es'

const result = map(data, fn)
```

### 4. Consolidate Duplicate Imports

**Before:**
```typescript
import { fitToKRD } from './converters'
// ... 50 lines later
import { krdToFit } from './converters'
```

**After:**
```typescript
import { fitToKRD, krdToFit } from './converters'
```

## Process

1. **Analyze**: Use TypeScript LSP to find all imports and their usage
2. **Transform**: Apply optimizations following project style guide
3. **Validate**: Ensure no type errors after changes
4. **Report**: Show statistics on optimizations made

## Safety Checks

- Always run `pnpm lint` after transformations
- Run `pnpm -r test` to ensure no breaking changes
- Create git commit with detailed changes if requested

## Project-Specific Rules

Following CLAUDE.md conventions:
- Use `type` keyword for type-only imports
- Maintain kebab-case file names
- Respect the 100-line file limit (may need to split files)
- Preserve AAA test pattern structure

## Output Report

```markdown
## Import Optimization Report

### Files Modified: 23

### Optimizations Applied:
- ✅ 12 wildcard imports converted to named imports
- ✅ 8 unused imports removed
- ✅ 5 type imports separated
- ✅ 3 duplicate imports consolidated

### Estimated Bundle Reduction: ~15KB

### Files Changed:
- packages/fit/src/adapters/krd-to-fit.converter.ts
- packages/tcx/src/adapters/duration/duration.converter.ts
- ...

### Next Steps:
Run: pnpm -r test && pnpm lint
```
