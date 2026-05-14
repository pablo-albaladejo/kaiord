<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/templates/MainLayout/`

## Purpose

The single top-level layout used by every route. Sticky header with logo + theme toggle + onboarding-replay trigger, then a max-width content container for the route. See `README.md` (in this directory) for the visual structure and responsive breakpoints.

## Key Files

- `MainLayout.tsx` / `.test.tsx` + `.stories.tsx` — top-level layout component.
- `LayoutHeader.tsx` / `.test.tsx` — sticky header.
- `README.md` — historical layout doc (visual structure + responsive behavior).
- `index.ts` — module export surface.

## Subdirectories

- `components/` — sub-parts (logo, header actions, navigation slots).

## For AI Agents

### Working In This Directory

1. **Layout is mobile-first.** Tailwind utility classes break at 640px (tablet) and 1024px (desktop).
2. **`onReplayTutorial` prop** is wired from `<App />` so the layout header can trigger the tutorial.

### Testing Requirements

- `MainLayout.test.tsx` covers the header + content slot composition.
- `LayoutHeader.test.tsx` covers the header actions.
- Story renders the layout in isolation under Storybook.

## Dependencies

### Internal

- `../../atoms/ThemeToggle`.
- `../../../contexts/ThemeContext`.

<!-- MANUAL: -->
