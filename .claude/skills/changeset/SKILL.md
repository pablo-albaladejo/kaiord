---
name: changeset
description: Create changeset for versionable changes before PR
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

Create changeset for current changes.

## Process

1. View changed files:

   ```bash
   git diff --name-only HEAD~1
   ```

2. Determine affected packages:
   - `@kaiord/core`
   - `@kaiord/cli`
   - `@kaiord/workout-spa-editor`

3. Suggest bump:
   - **patch**: Bug fixes, refactoring, docs
   - **minor**: New features, non-breaking changes
   - **major**: Breaking API changes

4. Create changeset:
   ```bash
   pnpm exec changeset
   ```

## Changeset Format

```md
---
"@kaiord/core": minor
---

Add ZWO format support for Zwift workout import/export
```

## Message Conventions

- Use English
- Start with verb: Add, Fix, Update, Remove
- Be specific about the change
- Do not include prefixes like feat: or fix:
