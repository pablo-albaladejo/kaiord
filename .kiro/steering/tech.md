## Tech Stack

- **Language**: TypeScript
- **Package Manager**: pnpm (monorepo with workspaces)
- **Build Tool**: tsup
- **Testing**: Vitest
- **Validation**: AJV (JSON schema validation)
- **CLI Framework**: yargs
- **Development**: Kiro (specs, hooks, steering docs)

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests across all packages
pnpm -r test

# CLI usage
pnpm kaiord --help
```

## Build System

This is a pnpm workspace monorepo. Use the `-r` (recursive) flag to run commands across all packages. Individual packages can be targeted using `--filter` or by navigating to their directory.

## Code Quality

- All code should be fully typed (no `any` types without justification)
- Schema validation is critical for data integrity
- Maintain round-trip conversion safety between formats
