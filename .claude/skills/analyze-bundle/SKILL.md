---
name: analyze-bundle
description: Analyze bundle sizes and identify optimization opportunities
---

# Analyze Bundle Size

Analyze the bundle sizes of packages in the Kaiord monorepo and suggest optimizations.

## What this skill does

1. **Package Size Analysis**: Check the built output sizes of each package
2. **Dependency Analysis**: Identify heavy dependencies and suggest lighter alternatives
3. **Import Optimization**: Find wildcard imports that could be tree-shaken
4. **Unused Dependencies**: Detect dependencies in package.json that aren't actually used

## How to use

Run this skill to get a comprehensive bundle analysis:

```
/analyze-bundle
```

Or analyze a specific package:

```
/analyze-bundle packages/fit
```

## Analysis Process

### 1. Build Size Check

For each package in the monorepo:

- Check `dist/` directory sizes after build
- Compare against typical size thresholds for libraries:
  - Core domain package: < 50KB
  - Adapter packages: < 200KB each
  - CLI: < 500KB

### 2. Heavy Dependencies

Check `package.json` for common heavy dependencies:

- Look for moment.js (suggest date-fns or native Date)
- Look for lodash (suggest lodash-es for tree-shaking)
- Identify any duplicate dependencies across packages

### 3. Import Analysis

Scan TypeScript files for optimization opportunities:

```typescript
// ❌ Avoid
import * as _ from "lodash";

// ✅ Better
import { map, filter } from "lodash-es";
```

### 4. Unused Dependencies

For each package.json:

- Parse all TypeScript files for actual imports
- Compare with dependencies listed
- Report any that are declared but never imported

## Output Format

```markdown
## Bundle Analysis Report - @kaiord/fit

### Package Size: 156KB (✅ within threshold)

### Heavy Dependencies:

- fast-xml-parser (89KB) - required for TCX parsing
- garmin-fitsdk (45KB) - required for FIT binary

### Import Optimizations:

No wildcard imports found ✅

### Unused Dependencies:

None found ✅

### Recommendations:

1. Consider splitting large adapter files if they exceed 100 lines
2. Evaluate if XSD validation can be optional/lazy-loaded
```

## Implementation

When invoked, perform these steps:

1. Run `pnpm -r build` to ensure fresh builds
2. Use `du -sh packages/*/dist` to check sizes
3. Use `grep -r "import \* as"` to find wildcard imports
4. Parse package.json and cross-reference with actual imports
5. Generate comprehensive report with actionable recommendations

## Kaiord-Specific Checks

- **FIT Package**: Check garmin-fitsdk binary size
- **TCX/ZWO Packages**: Check fast-xml-parser impact
- **Core Package**: Should be minimal (domain + ports only)
- **All Package**: Meta-package should re-export efficiently
- **CLI Package**: Check if bundling is optimal for distribution
