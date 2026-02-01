---
name: arch-review
description: Review code for hexagonal architecture violations. Use after modifying code in packages/core/src/
allowed-tools: Read, Glob, Grep
---

Analyze code changes for hexagonal architecture violations in Kaiord:

## Dependency Rules

- **domain/** → CANNOT import from application, ports, adapters, or external libs
- **application/** → Can only import from domain and ports, NEVER from adapters
- **ports/** → Pure interfaces/types only
- **adapters/** → Implements ports, can use external libs (@garmin/fitsdk, fast-xml-parser)

## Verification Checklist

1. Search for illegal imports between layers
2. Verify no external libs in domain/application
3. Check that adapters implement port interfaces
4. Verify use cases use DI via providers.ts

## Useful Commands

```bash
# Search for adapter imports in application
grep -r "from.*adapters" packages/core/src/application/

# Search for external lib imports in domain
grep -r "from.*@garmin\|fast-xml-parser" packages/core/src/domain/
```

Report violations with file paths and specific imports.
