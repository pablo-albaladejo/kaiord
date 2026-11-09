<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# scripts

## Purpose

Build-time TypeScript generators executed via `tsx` from `package.json` scripts. They translate the canonical Zod schemas into published JSON Schema artifacts.

## Key Files

| File                 | Description                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-schema.ts` | Reads `krdSchema` and `workoutSchema`, runs `z.toJSONSchema()`, and writes `schema/krd.json`, `schema/workout.json`, `schema/structured-workout-full.json`. Wired to `prebuild` and `build`. |

## For AI Agents

### Working In This Directory

- Run via `pnpm generate:schema`; it is also auto-invoked via `prebuild`.
- All file I/O uses Node's `fs` and `path`; `__dirname` is derived via `fileURLToPath(import.meta.url)` because the package is ESM (`"type": "module"`).
- Keep scripts side-effect-only at module scope; `process.exit(1)` on fatal errors.

<!-- MANUAL: -->
