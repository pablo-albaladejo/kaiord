<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# adapters

## Purpose

The ONLY adapter implementations that live inside `@kaiord/core`: a console-backed `Logger` and a no-op `Analytics`. Format-specific adapters (FIT, TCX, ZWO, GCN, Garmin Connect) deliberately live in their own packages so consumers can install only what they need; the two adapters here are universal infrastructure with no external runtime dependencies.

## Subdirectories

| Directory    | Purpose                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logger/`    | `createConsoleLogger()` — `Logger` impl that forwards to `console.debug/info/warn/error` (see `logger/AGENTS.md`)                                             |
| `analytics/` | `createNoopAnalytics()` — `Analytics` impl whose methods are empty functions, used as the default when no real analytics is wired (see `analytics/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- New format adapters do NOT belong here — they live in sibling workspace packages. Only add a subdirectory here for adapters that (a) have zero external runtime deps and (b) are useful to every consumer of `@kaiord/core`.
- All adapters MUST be exported via factory functions (`createXxx()`) returning the port type — never a `class` and never a singleton.

<!-- MANUAL: -->
