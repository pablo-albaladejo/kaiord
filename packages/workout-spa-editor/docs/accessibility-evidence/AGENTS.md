<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `docs/accessibility-evidence/`

## Purpose

Dated assistive-technology test runs. Each subfolder is one capture (date + scope), holding NVDA + VoiceOver transcripts and screenshots. Required by the desktop-AT version-drift policy in `src/store/README.md` (evidence is valid for AT + OS + browser versions within one major release of the pinned version).

## Subdirectories

- `2026-04-24-focus-management/` — focus-management AT evidence. Contains `README.md`, `nvda-windows.md`, `voiceover-macos.md`, plus `screenshots/`.

## For AI Agents

### Working In This Directory

1. **Folder name encodes the date + scope:** `YYYY-MM-DD-<scope>`.
2. **Each capture has its own README** that records AT + OS + browser versions.
3. **Captures expire.** If the pinned version is more than one major release behind today, re-capture or schedule a refresh per the policy.

### Refresh cadence

Quarterly cron + on dependency-bump trigger (per `store/README.md`).

## Dependencies

### Internal

- Referenced by `src/store/README.md` and `src/hooks/focus/`.

<!-- MANUAL: -->
