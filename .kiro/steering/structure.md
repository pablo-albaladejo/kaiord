# Structure

```
kaiord/
├─ packages/
│  ├─ core/          # @kaiord/core - Core library
│  │  ├─ src/        # Domain, application, ports, adapters
│  │  └─ dist/       # Build output (gitignored)
│  └─ cli/           # @kaiord/cli - Command-line interface
│     ├─ src/        # CLI implementation
│     └─ dist/       # Build output (gitignored)
├─ .kiro/            # Kiro configuration
│  ├─ steering/      # AI assistant guidance docs
│  ├─ specs/         # Feature specifications
│  └─ hooks/         # Automated validation hooks
├─ LICENSE           # MIT License
├─ NOTICE            # Copyright notice
├─ README.md         # Project documentation
└─ pnpm-workspace.yaml  # Monorepo configuration
```

## Conventions

- **Monorepo**: pnpm workspaces under `packages/`
- **Artifacts**: `dist/` and `node_modules/` are gitignored
- **Kiro**: `.kiro/` is version-controlled (steering, specs, hooks)
- **Licensing**: MIT; third-party tracked in `THIRD-PARTY-LICENSES.md`

## Package layout

- `src/` — TypeScript sources
- `dist/` — Compiled output via tsup
- `package.json`, `tsconfig.json` — per-package config
