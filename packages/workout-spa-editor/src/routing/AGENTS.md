<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/routing/`

## Purpose

Routing constants and pure routing helpers (back-origin contract, href builders, the nav-destinations registry). Routes themselves are declared via Wouter in `AppRoutes.tsx`; this directory carries typed path strings plus the runtime-free helper functions that build or resolve them.

## Key Files

- `constants.ts` — route path constants (`/calendar`, `/library`, `/workout/new`, `/workout/:id`).
- `nav-destinations.ts` — single source of truth for header/bottom-nav destinations (parity-tested).
- `back-origin.ts` / `resolve-back-target.ts` — `?from=` origin contract for back navigation.
- `adjust-with-ai-href.ts` — chat prefill deep-link for the "adjust with AI" action.

## For AI Agents

### Working In This Directory

1. **No runtime code** — strings + types only.
2. **Wouter is the router.** Don't introduce React Router.

## Dependencies

### Internal

- None.

<!-- MANUAL: -->
