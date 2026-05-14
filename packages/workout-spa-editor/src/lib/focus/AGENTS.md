<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/lib/focus/`

## Purpose

Low-level focus helpers used by `hooks/focus/use-focus-after-action`. Observes overlay (dialog/popover) state so the focus hook can defer apply until overlays close, and computes the "where do we focus if the target is gone?" fallback chain.

## Key Files

- `overlay-observer.ts` / `.test.ts` — `MutationObserver` over Radix overlay roots.
- `overlay-mutation-observer.ts` — the low-level observer.
- `overlay-count.ts` — current overlay count derived from the observer state.
- `overlay-singleton.ts` — module-scope singleton so observers don't multiply across renders.
- `fallback-chain.ts` / `.test.ts` — computes the focus-fallback sequence (same item → next sibling → parent → empty-state).

## For AI Agents

### Working In This Directory

1. **Single observer at module scope.** The overlay observer is a singleton; do not instantiate per consumer.
2. **The fallback chain is pure.** It takes the resolved DOM state and returns the next selector to try; no side effects.

### Testing Requirements

- `overlay-observer.test.ts` exercises mount/unmount of Radix overlays in jsdom.

## Dependencies

### Internal

- None (leaf).

### External

- `MutationObserver` (DOM).

<!-- MANUAL: -->
