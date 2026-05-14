<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/atoms/`

## Purpose

Leaf UI primitives. No business logic; no Dexie reads; no Zustand selectors beyond pure-presentational. Each atom is a single visual element with a stable, accessible API.

## Key Files

- `RouteSpinner.tsx` — Suspense fallback used by `<App />` while lazy-loaded pages resolve. Lives at this level rather than in a folder because it has no variants.

## Subdirectories

- `Badge/` — `Badge.tsx` (status pill) + styles + stories + tests + README.
- `Button/` — `Button.tsx` + `LoadingSpinner.tsx` + styles + stories + tests + README. Primary, secondary, ghost, danger variants.
- `ErrorMessage/` — `ErrorMessage.tsx` + `ErrorActions.tsx` + `ValidationErrorList.tsx` + stories + tests.
- `Icon/` — `Icon.tsx` wrapper over `lucide-react` + stories + tests + README + EXAMPLES.
- `Input/` — `Input.tsx` + `InputElement.tsx` + `InputMessages.tsx` + styles + types + stories + tests + README. Text + numeric + select variants.
- `ThemeToggle/` — `ThemeToggle.tsx` (light/dark switch consuming `useTheme`) + stories + tests.
- `Toast/` — `Toast.tsx` + `ToastProvider.tsx` + styles + types + tests. Radix-Toast wrapper used by `useToast`.
- `Tooltip/` — `Tooltip.tsx` + `compute-position.ts` (positioning math) + `use-tooltip-state.ts` + tests.

## For AI Agents

### Working In This Directory

1. **No business logic.** Atoms accept props; they don't read from the store or Dexie.
2. **A11y first.** Every interactive atom passes the `@storybook/addon-a11y` checks in its story.
3. **Single responsibility.** Adding a "primary button that also fires an action" is wrong — wrap the atom in a molecule instead.
4. **Tooltip math is pure.** `compute-position.ts` is a pure function tested separately.

### Testing Requirements

- `.test.tsx` per atom. Stories use the a11y addon.
- Use `expectNoReactWarnings()` when atoms accept arbitrary props that pass through to the DOM (Button + Input do).

### Common Patterns

- Folder shape: `<Name>.tsx` + `<Name>.stories.tsx` + `<Name>.test.tsx` + `index.ts` (legacy) + optional `<name>-styles.ts` / `<Name>.types.ts` / `<Name>.styles.ts`.
- README per-atom describing variants and a11y notes.

## Dependencies

### Internal

- `../../contexts/ThemeContext` (ThemeToggle only).

### External

- `react`, `lucide-react`, `@radix-ui/react-toast` (Toast only), `tailwindcss`.

<!-- MANUAL: -->
