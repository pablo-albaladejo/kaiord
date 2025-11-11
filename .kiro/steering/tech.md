# Tech

## Stack

- **Language**: TypeScript
- **Packages**: pnpm workspaces
- **Build**: tsup
- **Tests**: Vitest
- **Validation**: AJV (JSON Schema)
- **CLI**: yargs
- **Dev process**: Kiro (specs, hooks, steering)

## Common commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests across all packages
pnpm -r test

# CLI help
pnpm kaiord --help
```

## Notes

- Use `-r` (recursive) to run across workspaces
- Target individual packages with `--filter` or `cd packages/<name>`
- Keep code fully typed; prioritize schema-driven and round-trip safe workflows
