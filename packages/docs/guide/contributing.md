---
title: "Contributing"
description: "How to contribute to Kaiord: development setup, coding standards, PR workflow, and commit conventions."
---

# Contributing

Kaiord welcomes contributions. This guide covers the development workflow.

## Setup

```bash
git clone https://github.com/pablo-albaladejo/kaiord.git
cd kaiord
pnpm install
pnpm -r build
pnpm -r test
```

## Branch naming

- `feature/my-feature` -- new features
- `fix/my-fix` -- bug fixes
- `docs/my-docs` -- documentation changes

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add ZWO round-trip validation
fix(fit): handle empty lap arrays
docs: update architecture guide
```

## PR workflow

1. Create a feature branch from `main`
2. Implement changes following hexagonal architecture
3. Add tests (TDD -- failing test first)
4. Run `pnpm -r test && pnpm -r build && pnpm lint:fix`
5. Add changeset: `pnpm exec changeset`
6. Open a PR against `main`

## Code style

- TypeScript strict mode
- Max 100 lines per file (tests exempt)
- Max 40 lines per function
- Use `type` not `interface`
- Separate type imports: `import type { X } from "..."`
- Functions over classes

## Next steps

- [Architecture](/guide/architecture) -- understand the codebase structure
- [Testing](/guide/testing) -- testing practices
- [Quick Start](/guide/quick-start) -- try Kaiord before contributing
