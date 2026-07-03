<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# ports

## Purpose

Interface-only definitions ("ports" in hexagonal terminology). Pure `type` declarations that allow the application layer to talk to format adapters, loggers, auth providers, persistence, and analytics WITHOUT taking a direct dependency on any implementation.

## Key Files

| File | Description |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------- |
| `format-strategy.ts` | The four conversion port types: `BinaryReader`/`BinaryWriter` (Uint8Array ↔ KRD) and `TextReader`/`TextWriter` (string ↔ KRD). |
| `logger.ts` | `Logger` interface (`debug`/`info`/`warn`/`error`, each taking a message and optional context record) and `LogLevel` union. |
| `auth-provider.ts` | `AuthProvider` port (`login`/`is_authenticated`/`export_tokens`/`restore_tokens`/`logout`) and opaque `TokenData = Record<string, unknown>`. |
| `token-store.ts` | `TokenStore` port (`save`/`load`/`clear`) for persisting `TokenData` between sessions. |
| `workout-service.ts` | `WorkoutService` port (`push`/`pull`/`list`/`remove`) plus `WorkoutSummary`, `PushResult`, `ListOptions` DTOs for remote services like Garmin Connect. |
| `analytics.ts` | `Analytics` port (`pageView`/`event`) and `AnalyticsEvent = Record<string, string                                                                      | number | boolean>`. |
| `index.ts` | Barrel re-export of all port types. |
| `logger.test.ts` | Smoke test against a stub `Logger` to lock the shape. |

## For AI Agents

### Working In This Directory

- Files in this directory MUST export TYPES ONLY (`export type` / `export interface` — but per project style, prefer `type`). No runtime values, no Zod schemas, no `class`es, no implementations.
- A port is invariant: changing a port's shape breaks every adapter package downstream. Treat additions as additive (optional fields preferred); breaking changes require a major version bump and a coordinated update across `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin-connect`, etc.
- The four format-strategy types are deliberately plain function types (not objects), so adapters can be pure functions: `const fitReader: BinaryReader = async (buf) => ...`.
- `WorkoutService.push/pull/list/remove` use snake-free camelCase (`workoutId`); `AuthProvider` uses snake_case method names (`is_authenticated`, `export_tokens`) for historical Garmin SSO compatibility — preserve that asymmetry.

### Testing Requirements

- Coverage target: 80%. Type-only files have implicit coverage via downstream usage; only `logger.test.ts` exists as an explicit shape lock. Follow AAA + `should ` invariants.

### Common Patterns

- **Function-shaped ports** for stateless conversions (`BinaryReader`).
- **Record-of-methods ports** for stateful services (`AuthProvider`, `WorkoutService`, `TokenStore`, `Logger`).

## Dependencies

### Internal

- `../domain/schemas/krd` — referenced for the `KRD` type in reader/writer/service signatures.

### External

None.

<!-- MANUAL: -->
