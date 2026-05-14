<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/templates/`

## Purpose

Page layouts — the structural shell rendered around every route. Currently a single template (`MainLayout`); future layouts (editor-specific shells, modal-only shells) would live here.

## Subdirectories

- `MainLayout/` — sticky header + content container + theme/onboarding affordances; wraps every route via `<App />`.

## For AI Agents

### Working In This Directory

1. **Layouts are presentational** — they don't read from Dexie or own page state.
2. **One layout per folder.**

## Dependencies

### Internal

- `../atoms/*`, `../molecules/*`.

<!-- MANUAL: -->
