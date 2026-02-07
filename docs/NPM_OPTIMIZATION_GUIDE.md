# NPM Optimization Guide for Kaiord

This guide explains how to use the npm optimization skills installed in your Claude Code project.

## 🎯 Installed Skills

### 1. `/check-deps` - Dependency Analysis

**Purpose:** Comprehensive dependency health check

**What it analyzes:**

- ✅ Unused dependencies
- ✅ Duplicate dependencies across packages
- ✅ Security vulnerabilities
- ✅ Outdated packages with updates
- ✅ Architecture boundary violations

**Usage:**

```bash
/check-deps                    # All packages
/check-deps packages/core      # Specific package
/check-deps --security         # Security only
```

**When to run:**

- ✅ After modifying package.json
- ✅ Weekly maintenance
- ✅ Before releases
- ✅ When adding new dependencies

---

### 2. `/analyze-bundle` - Bundle Size Analysis

**Purpose:** Identify large bundles and optimization opportunities

**What it checks:**

- 📦 Built output sizes (dist/ directories)
- 🐘 Heavy dependencies (>100KB)
- 🎯 Package-specific size thresholds
- 💡 Optimization recommendations

**Usage:**

```bash
/analyze-bundle                   # All packages
/analyze-bundle packages/fit      # Specific package
```

**Package Size Targets:**

- @kaiord/core: < 50KB (domain only)
- @kaiord/fit: < 200KB
- @kaiord/tcx: < 200KB
- @kaiord/zwo: < 200KB
- @kaiord/cli: < 500KB

**When to run:**

- ✅ After adding dependencies
- ✅ Before releases
- ✅ Monthly maintenance
- ✅ When bundle seems too large

---

### 3. `/optimize-imports` - Import Refactoring

**Purpose:** Improve tree-shaking and reduce bundle size

**What it does:**

- ⚡ Converts wildcard imports to named imports
- 🎯 Separates type imports
- 🧹 Removes unused imports
- 📦 Consolidates duplicate imports

**Usage:**

```bash
/optimize-imports                        # All files
/optimize-imports packages/fit           # Specific package
/optimize-imports path/to/file.ts       # Single file
```

**Transformations:**

**Before:**

```typescript
import * as z from "zod";
import { KRD, toKRD, fromKRD } from "@kaiord/core";
```

**After:**

```typescript
import { object, string } from "zod";
import type { KRD } from "@kaiord/core";
import { toKRD, fromKRD } from "@kaiord/core";
```

**When to run:**

- ✅ After adding new imports
- ✅ Before creating PRs
- ✅ During refactoring
- ✅ When you see `import *` patterns

---

## 🔄 Integration with Development Workflow

### Before Creating a PR

```bash
# 1. Run optimization checks
/check-deps
/analyze-bundle
/optimize-imports

# 2. Run tests and lint
pnpm -r test
pnpm lint:fix

# 3. Create changeset
pnpm exec changeset

# 4. Commit changes
git add .
git commit -m "feat: your feature"
```

### Weekly Maintenance Routine

```bash
# Run comprehensive analysis
/check-deps
/analyze-bundle

# Review recommendations and apply updates
pnpm update

# Verify nothing broke
pnpm -r test
```

### After Adding Dependencies

```bash
# Immediately check impact
/check-deps packages/your-package
/analyze-bundle packages/your-package

# Ensure:
# - No unused dependencies
# - Bundle size increase is acceptable
# - No security issues introduced
```

---

## 🪝 Automated Checks (Hooks)

### Pre-Commit Hook

Located at: `.claude/hooks/pre-commit.ts`

**Triggers when:**

- TypeScript files are modified
- package.json is changed
- Bundle-related files are updated

**What it does:**

- Reminds you to run optimization checks
- Warns about dependency changes
- Provides helpful tips

### Weekly Maintenance Hook

Located at: `.claude/hooks/weekly-maintenance.ts`

**Usage:**

```bash
# Run manually for comprehensive maintenance
# This hook provides a checklist of optimization tasks
```

---

## 📊 Example: Dependency Analysis Report

When you run `/check-deps packages/core`, you'll get:

```markdown
# Dependency Analysis Report - @kaiord/core

## Summary

- ✅ 0 unused dependencies
- ✅ 0 security vulnerabilities
- ⚠️ 2 duplicate dependencies
- ✅ Architecture boundaries respected

## Detailed Analysis

### Package: @kaiord/core

Status: ✅ CLEAN
Dependencies: 2

- zod: ^3.22.4 (✅ used in 23 files)
- typescript: ^5.3.3 (✅ used)

### Outdated Packages:

- typescript: 5.3.3 → 5.4.2 (patch available)

### Recommendations:

1. Update typescript to 5.4.2
2. No action needed for architecture
```

---

## 🎯 Best Practices

### Dependency Management

1. **Minimize dependencies** - Check if functionality exists in existing deps
2. **Prefer smaller alternatives** - date-fns over moment, lodash-es over lodash
3. **Use workspace dependencies** - Share common deps across packages
4. **Review before adding** - Run `/check-deps` after adding dependencies
5. **Keep @kaiord/core lean** - Minimal dependencies in domain layer

### Import Optimization

Following CLAUDE.md conventions:

- ✅ Use named imports: `import { map } from 'lodash-es'`
- ✅ Separate type imports: `import type { KRD } from '@kaiord/core'`
- ❌ Avoid wildcard imports: `import * as _ from 'lodash'`
- ✅ Group imports: types first, then implementation

### Bundle Size Monitoring

- Run `/analyze-bundle` before each release
- Keep an eye on size trends over time
- Investigate any sudden size increases
- Consider lazy-loading for heavy features

---

## 🔍 Troubleshooting

### "Skill not found" error

Ensure you're in the project root directory: `/Users/pablo/development/personal/kaiord`

### False positives in dependency analysis

Some dependencies may be used only in specific environments (e.g., test-only deps). Review recommendations manually.

### Bundle size seems wrong

Run a fresh build first: `pnpm -r build`

### Import optimization breaks tests

Always run `pnpm -r test` after applying import optimizations

---

## 📚 Additional Resources

- **CLAUDE.md** - Project conventions and architecture
- **.claude/README.md** - Detailed skill documentation
- **AGENTS.md** - AI guidance and non-negotiables
- **Claude Code Docs** - https://code.claude.com/docs

---

## 🚀 Quick Reference

| Task                     | Command                                               |
| ------------------------ | ----------------------------------------------------- |
| Check all dependencies   | `/check-deps`                                         |
| Check specific package   | `/check-deps packages/core`                           |
| Analyze all bundle sizes | `/analyze-bundle`                                     |
| Optimize all imports     | `/optimize-imports`                                   |
| Security audit only      | `/check-deps --security`                              |
| Full pre-PR check        | `/check-deps && /analyze-bundle && /optimize-imports` |

---

**Last Updated:** 2026-02-07
**Skills Version:** 1.0.0
**Maintainer:** Kaiord Development Team
