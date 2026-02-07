---
name: npm-review
description: Comprehensive npm optimization review using all optimization skills
---

# NPM Package Review Agent

Comprehensive npm package optimization agent that orchestrates all npm optimization skills to provide a complete analysis.

## What this skill does

Runs a **complete npm optimization workflow** using the three core optimization skills:

1. **Dependency Analysis** (`/check-deps`)
2. **Bundle Analysis** (`/analyze-bundle`)
3. **Import Optimization** (`/optimize-imports`)

This agent provides:
- Consolidated report across all packages
- Prioritized action items
- Cross-package optimization opportunities
- Implementation guidance

## How to use

Review all packages in the monorepo:
```
/npm-review
```

Review specific package:
```
/npm-review packages/fit
```

Quick scan (dependencies + bundles only, no import optimization):
```
/npm-review --quick
```

## Execution Flow

The agent executes skills in this order:

### Phase 1: Dependency Health Check
Runs `/check-deps` on target packages to identify:
- Unused dependencies
- Duplicate dependencies across packages
- Security vulnerabilities
- Outdated packages
- Architecture violations

### Phase 2: Bundle Analysis
Runs `/analyze-bundle` on target packages to identify:
- Bundle sizes vs thresholds
- Heavy dependencies
- Wildcard imports
- Optimization opportunities

### Phase 3: Import Optimization (optional)
If `--quick` flag is NOT used, runs `/optimize-imports` to:
- Convert wildcard imports to named imports
- Separate type imports
- Remove unused imports
- Consolidate duplicate imports

### Phase 4: Consolidated Report
Generates comprehensive report with:
- Executive summary
- Per-package findings
- Cross-package analysis (duplicates, common patterns)
- Prioritized action plan (Critical → High → Medium → Low)
- Estimated effort for each fix

## Report Format

```markdown
# NPM Optimization Review - Kaiord Monorepo

## Executive Summary

**Health Score: 8.5/10**

- ✅ 0 security vulnerabilities
- ⚠️ 2 ESLint warnings
- ⚠️ 4 packages missing sideEffects
- ✅ Clean architecture (1 minor violation)

---

## Package Reviews

### @kaiord/core
**Dependencies:** ✅ CLEAN (0 unused, 0 duplicates)
**Bundle Size:** ⚠️ 588KB (target: <50KB) - investigate
**Imports:** ✅ No wildcard imports
**Critical:** Move garmin-fitsdk.d.ts to fit package

### @kaiord/fit
**Dependencies:** ✅ CLEAN
**Bundle Size:** ✅ 60KB (within threshold)
**Imports:** ✅ Optimized
**Action:** Add sideEffects: false

[... continue for all packages]

---

## Cross-Package Analysis

### Duplicate Dependencies
- `zod`: Used in 6 packages (consistent v3.25.76) ✅
- `fast-xml-parser`: Shared by tcx & zwo ✅

### Common Patterns
- 4 packages missing `sideEffects: false`
- Test fixtures handling inconsistent

---

## Prioritized Action Plan

### Critical (Fix Immediately) - 5 min
1. Move `garmin-fitsdk.d.ts` from core to fit
   Impact: Architecture compliance

### High Priority (Fix This Sprint) - 30 min
2. Add `sideEffects: false` to fit, tcx, zwo, all
   Impact: Better tree-shaking for consumers

3. Publish new packages to npm
   Impact: Makes refactoring available to users

[... continue with Medium & Low priority]

---

## Next Steps

```bash
# 1. Fix critical issue
git mv packages/core/src/types/garmin-fitsdk.d.ts packages/fit/src/types/

# 2. Add sideEffects
# Edit package.json in fit, tcx, zwo, all

# 3. Test everything
pnpm -r test && pnpm lint

# 4. Commit
git add . && git commit -m "fix: npm optimization improvements"
```

**Estimated Total Effort:** 35 minutes
```

## Implementation

When this skill is invoked:

1. Parse arguments to determine scope:
   - No args: Review all packages
   - `packages/name`: Review specific package
   - `--quick`: Skip import optimization

2. Execute skills in sequence:
   ```
   /check-deps [scope]
   /analyze-bundle [scope]
   /optimize-imports [scope]  # unless --quick
   ```

3. Aggregate results from all three skills

4. Generate consolidated report with:
   - Executive summary (scores, critical issues)
   - Per-package findings (structured)
   - Cross-package analysis (patterns, duplicates)
   - Prioritized action plan (Critical/High/Medium/Low)
   - Next steps with commands

5. Save report to `/tmp/npm-review-report-{timestamp}.md`

6. Display summary and link to full report

## Integration with Development Workflow

### When to Use

**Before PR:**
```bash
/npm-review  # Full review
# Review report, fix critical/high items
pnpm -r test && pnpm lint
```

**After Adding Dependencies:**
```bash
/npm-review packages/your-package
# Quickly check impact of new dependency
```

**Weekly Maintenance:**
```bash
/npm-review
# Comprehensive analysis
# Plan work for next sprint
```

**CI/CD Integration:**
```bash
# In .github/workflows/quality.yml
/npm-review --quick --json > review.json
# Parse JSON, fail if critical issues found
```

## Quality Standards Compliance

Following CLAUDE.md Quality Standards:
- ✅ **Zero tolerance** - All critical issues must be fixed
- ✅ **Proactive cleanup** - Identifies pre-existing issues
- ✅ **Boy Scout Rule** - Leaves codebase cleaner

This skill aligns with the project's zero-tolerance policy:
- Reports ALL warnings and errors
- Prioritizes fixes by severity
- Provides actionable remediation steps

## Example Output

```bash
$ /npm-review

Running comprehensive npm optimization review...

Phase 1/3: Dependency Analysis ⏳
  ✅ @kaiord/core - CLEAN
  ✅ @kaiord/fit - CLEAN
  ✅ @kaiord/tcx - CLEAN
  ✅ @kaiord/zwo - CLEAN
  ✅ @kaiord/all - CLEAN
  ✅ @kaiord/cli - CLEAN

Phase 2/3: Bundle Analysis ⏳
  ⚠️ @kaiord/core - 588KB (investigate)
  ✅ @kaiord/fit - 60KB
  ✅ @kaiord/tcx - 24KB
  ✅ @kaiord/zwo - 40KB
  ✅ @kaiord/all - 4KB
  ✅ @kaiord/cli - 56KB

Phase 3/3: Import Optimization ⏳
  ✅ No wildcard imports found
  ✅ Type imports properly separated
  ✅ No unused imports detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 HEALTH SCORE: 8.5/10

Critical Issues: 1
High Priority: 2
Medium Priority: 2
Low Priority: 4

Full report saved to: /tmp/npm-review-report-2026-02-07.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL (Fix Now - 5 min):
  1. Move garmin-fitsdk.d.ts from core to fit

⚠️  HIGH PRIORITY (This Sprint - 30 min):
  2. Add sideEffects: false to 4 packages
  3. Publish new packages to npm

Run: cat /tmp/npm-review-report-2026-02-07.md
```

## Notes

- Respects CLAUDE.md Quality Standards (zero tolerance)
- Follows project conventions (English, concise, actionable)
- Integrates with existing skills ecosystem
- Provides both human-readable and machine-parseable output
- Designed for both manual and automated use
