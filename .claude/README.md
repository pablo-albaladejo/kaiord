# Claude Code Configuration

This directory contains Claude Code configuration, skills, and hooks for the Kaiord project.

## Directory Structure

```
.claude/
├── README.md                    # This file
├── agents/                      # Specialized AI agents
│   └── npm-optimizer.md         # NPM optimization agent
├── skills/                      # Custom Claude Code skills
│   ├── analyze-bundle/          # Bundle size analysis
│   ├── optimize-imports/        # Import optimization
│   └── check-deps/              # Dependency analysis
├── hooks/                       # Development automation hooks
│   ├── pre-commit.ts            # Pre-commit checks
│   └── weekly-maintenance.ts    # Periodic maintenance tasks
└── settings.json                # Project-level Claude Code settings
```

## Available Skills

### `/analyze-bundle`

Analyzes bundle sizes across all packages and identifies optimization opportunities.

**What it checks:**

- Built output sizes (dist/ directories)
- Heavy dependencies (>100KB)
- Optimization opportunities
- Package-specific thresholds

**Usage:**

```bash
/analyze-bundle                   # All packages
/analyze-bundle packages/fit      # Specific package
```

**When to run:**

- After adding new dependencies
- Before releases
- When bundle size seems too large
- Monthly as part of maintenance

---

### `/optimize-imports`

Refactors imports for better tree-shaking and smaller bundles.

**What it does:**

- Converts wildcard imports to named imports
- Separates type imports
- Removes unused imports
- Consolidates duplicate imports

**Usage:**

```bash
/optimize-imports                           # All files
/optimize-imports packages/fit              # Specific package
/optimize-imports path/to/file.ts          # Single file
```

**When to run:**

- After adding new imports
- Before creating PRs
- When you notice `import *` patterns
- As part of refactoring

---

### `/check-deps`

Comprehensive dependency analysis across the monorepo.

**What it checks:**

- Unused dependencies
- Duplicate dependencies across packages
- Outdated packages with updates
- Security vulnerabilities
- Architecture boundary violations

**Usage:**

```bash
/check-deps                     # All packages
/check-deps packages/core       # Specific package
/check-deps --security          # Security audit only
```

**When to run:**

- After modifying package.json
- Weekly maintenance
- Before releases
- When adding new dependencies

---

## Development Workflow Integration

### Automated Checks (via Hooks)

The pre-commit hook automatically reminds you to run optimization checks when:

- TypeScript files are modified
- package.json is changed
- Bundle-related files are updated

### Manual Workflow

**Before Creating a PR:**

```bash
# 1. Run all optimization checks
/check-deps
/analyze-bundle
/optimize-imports

# 2. Run tests and lint
pnpm -r test
pnpm lint:fix

# 3. Create changeset if needed
pnpm exec changeset

# 4. Commit
git add .
git commit -m "feat: your changes"
```

**Weekly Maintenance:**

```bash
# Run comprehensive analysis
/check-deps
/analyze-bundle

# Review and apply recommendations
# Update dependencies if needed
pnpm update

# Run tests to ensure nothing broke
pnpm -r test
```

**After Adding Dependencies:**

```bash
# Immediately check impact
/check-deps packages/your-package
/analyze-bundle packages/your-package

# Ensure no unused dependencies snuck in
# Check bundle size increase is acceptable
```

---

## Best Practices

### Bundle Size Thresholds

- **@kaiord/core**: < 50KB (domain types only)
- **@kaiord/fit**: < 200KB (includes garmin-fitsdk)
- **@kaiord/tcx**: < 200KB (includes fast-xml-parser)
- **@kaiord/zwo**: < 200KB (includes fast-xml-parser + XSD)
- **@kaiord/cli**: < 500KB (bundled for distribution)

### Dependency Guidelines

1. **Avoid unnecessary dependencies** - Check if functionality can be implemented with existing deps
2. **Prefer smaller alternatives** - date-fns over moment, lodash-es over lodash
3. **Use workspace dependencies** - Share common deps across packages
4. **Review before adding** - Run `/check-deps` after adding new dependencies
5. **Keep core lean** - @kaiord/core should have minimal dependencies

### Import Optimization Rules

Following CLAUDE.md conventions:

- ✅ Use named imports: `import { map } from 'lodash-es'`
- ✅ Separate type imports: `import type { KRD } from '@kaiord/core'`
- ❌ Avoid wildcard imports: `import * as _ from 'lodash'`
- ✅ Group imports: types first, then implementation

---

## Troubleshooting

### "Skill not found" error

Ensure you're in the project root directory. Skills are project-scoped to this repository.

### Hooks not running

Check that hooks are executable and follow TypeScript types from `@anthropic-ai/claude-code`.

### False positives in dependency analysis

Some dependencies may be used only in specific environments (e.g., test-only deps). Review recommendations manually.

---

## Contributing

When adding new skills or hooks:

1. Document them in this README
2. Add inline comments explaining behavior
3. Test manually before committing
4. Update CLAUDE.md if they affect the main workflow

For questions about these tools, see the main project documentation or the Claude Code docs.
