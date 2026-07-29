<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/templates/MainLayout/`

## Purpose

The single top-level layout used by every route. Sticky header with logo + one nav row (`StatusHeader`), then a max-width content container for the route. The theme toggle and the onboarding-replay trigger are no longer here: the toggle moved into the header's avatar menu with the rest of the account-level chrome, and the tutorial was retired. See `README.md` (in this directory) for the visual structure and responsive breakpoints.

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
2. **Header overlays are lazy.** `use-header-overlays.ts` owns the `?` shortcut sheet and the ⌘K command palette; both mount only after their first open.

### Testing Requirements

- `MainLayout.test.tsx` covers the header + content slot composition.
- `LayoutHeader.test.tsx` covers the header actions.
- Story renders the layout in isolation under Storybook.

## Dependencies

### Internal

- `../../molecules/StatusHeader` (the nav row; owns the avatar menu, which is where `atoms/ThemeToggle` now renders).
- `../../../contexts/ThemeContext`.

<!-- MANUAL: -->
