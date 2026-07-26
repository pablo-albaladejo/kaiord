<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/types/ AGENTS.md

## Purpose

TypeScript type declarations and ambient type definitions. Currently holds type stubs for the Umami analytics tracker API, allowing type-safe access to `window.umami`.

## Key Files

- **`umami.d.ts`** (10 LOC) — Ambient TypeScript declarations for the Umami tracker. Defines `UmamiTracker` interface with `track()` method and extends `Window` to include optional `umami` property.

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Ambient declarations** — `.d.ts` files without imports become global type definitions.
- **Extend built-in types** — use `interface Window { ... }` to add properties to the global window object.
- **Optional properties** — use `?` to mark properties as optional (e.g., `umami?: UmamiTracker`).
- **Method signatures** — define parameter and return types precisely. Use `Record<string, ...>` for flexible objects.

### Testing Requirements

- **Type checking only** — these files are not executed or tested. TypeScript compiler verifies correctness.
- **No vitest coverage** — types are checked during `pnpm build` and `pnpm lint`.

### Common Patterns

- **Ambient module** — declare global interfaces without `export`.
- **Interface composition** — reuse existing types; extend them rather than duplicating.
- **Null-safe operations** — use `?.` optional chaining in code accessing optional properties.

## Dependencies

### Internal

None.

### External

- **TypeScript** — types are checked by tsc during build.

## Notes

- **Umami tracker shape** — `track(name: string, props?: Record<string, string | number | boolean>)` matches the actual Umami tracker API. The `props` object carries event metadata (e.g., `{ path: "/editor/" }`).
- **Optional property** — `window.umami?` is optional because the tracker may not be injected (when website id is missing or in non-browser environments).

<!-- MANUAL: -->
