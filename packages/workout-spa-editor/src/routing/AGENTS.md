<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/routing/`

## Purpose

Routing constants. Routes themselves are declared in `src/App.tsx` via Wouter; this directory carries the path strings + param patterns so they're typed at usage sites.

## Key Files

- `constants.ts` — route path constants (`/calendar`, `/library`, `/workout/new`, `/workout/:id`).

## For AI Agents

### Working In This Directory

1. **No runtime code** — strings + types only.
2. **Wouter is the router.** Don't introduce React Router.

## Dependencies

### Internal

- None.

<!-- MANUAL: -->
