<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/providers/`

## Purpose

Top-level providers that are component-shaped (i.e. they wrap children with a Radix root) rather than pure context providers. The context-only providers live under `src/contexts/`.

## Key Files

- `AppToastProvider.tsx` — wraps the app in `@radix-ui/react-toast`'s Provider + Viewport, plus the in-house `ToastProvider` from `atoms/Toast/`. Mounted at the top of `<App />`.

## For AI Agents

### Working In This Directory

1. **Order in `<App />` matters.** `AppToastProvider` mounts above `MainLayout` so the toast viewport is a sibling of (not inside) the main scroll surface.
2. **Single source of truth:** the `useToast()` hook from `src/hooks/useToast.ts` consumes this provider — components don't talk to Radix Toast directly.

## Dependencies

### Internal

- `../atoms/Toast/ToastProvider`.

### External

- `@radix-ui/react-toast`.

<!-- MANUAL: -->
