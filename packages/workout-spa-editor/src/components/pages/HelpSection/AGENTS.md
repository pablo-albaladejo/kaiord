<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/pages/HelpSection/`

## Purpose

In-app help drawer surfaced from the editor: keyboard-shortcuts reference + feature highlights.

## Key Files

- `HelpSection.tsx` / `.test.tsx` — the drawer component.
- `index.ts` — module export surface.

## Subdirectories

- `components/` — leaf UI used inside the drawer (per-shortcut row, section headers).
- `sections/` — content sections (Keyboard, Features, etc.).

## For AI Agents

### Working In This Directory

1. **Content is static.** Help text lives in `sections/*` as ordinary JSX, not in a CMS.
2. **Do not hand-write shortcut rows.** `sections/shortcuts/ShortcutGroupSection.tsx` renders `src/constants/shortcut-catalog.ts`, the single source of truth for every binding. Add a shortcut by adding a catalog row (and its `help` i18n label); `src/constants/shortcut-catalog.test.ts` fails when a row and `KeyboardShortcutHandlers` disagree, so there is no manual sync step.

## Dependencies

### Internal

- `../../atoms/*`, `../../molecules/*`.

<!-- MANUAL: -->
