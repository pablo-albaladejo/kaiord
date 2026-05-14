<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `docs/`

## Purpose

Package-local documentation. The monorepo's general docs (architecture, KRD format, testing strategy) live at `../../docs/` at the repo root; this directory holds SPA-only feature documentation.

## Key Files

- `analytics.md` — Cloudflare Analytics adapter wiring, the events emitted, PII-scrub guarantees, and the staging-verification procedure.
- `block-id-system.md` — `ItemId` lifecycle, hydration, and the strip-ids chokepoint.
- `delete-button-styling-comparison.md` — visual/styling rules for delete buttons across molecules (pinned by `delete-button-styling.test.tsx`).
- `keyboard-shortcuts.md` — user-facing keyboard-shortcut reference (mirrored by `HelpSection/`).
- `modal-system.md` — confirmation-modal patterns and Radix-Dialog conventions.
- `performance-optimization.md` — perf-baseline + measure-test guide (paired with `src/__perf__/`).
- `repetition-block-deletion.md` — design + UX rationale for the block-deletion flow.
- `kiroween-theme.md` — empty placeholder (legacy / WIP).

## Subdirectories

- `accessibility-evidence/` — captured AT runs (NVDA + VoiceOver), per `store/README.md`'s desktop-AT version-drift policy.

## For AI Agents

### Working In This Directory

1. **Docs here are package-local.** Cross-package guidance (KRD format, hexagonal architecture) belongs at `../../docs/`.
2. **Pair docs with tests** when the doc encodes a behavior (e.g. `delete-button-styling-comparison.md` ↔ `delete-button-styling.test.tsx`, `performance-optimization.md` ↔ `src/__perf__/`).

## Dependencies

### Internal

- Linked from `README.md` of the package.

<!-- MANUAL: -->
