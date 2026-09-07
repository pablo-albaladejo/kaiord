<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-09-06 -->

# `.storybook/`

## Purpose

Storybook 10 configuration. The SPA uses the `@storybook/react-vite` framework + the `@storybook/addon-a11y` addon. Stories live under `src/**/*.stories.tsx` (and `src/**/*.mdx`); they are NOT colocated outside `src/`.

## Key Files

- `main.ts` — Storybook config: stories glob (`../src/**/*.stories.@(js|jsx|mjs|ts|tsx)` + `*.mdx`), `react-vite` framework, `addon-a11y` addon, `react-docgen` for prop docs. It loads as ESM (the package is `"type": "module"`), so anything CommonJS here needs `createRequire(import.meta.url)`.
- `preview.tsx` — global decorators + parameters. The decorator wraps every story in `ThemeProvider > LocaleProvider > UnitsProvider > GarminBridgeProvider`; a story that wraps itself still works, because the inner provider wins for its own subtree. It is `.tsx`, not `.ts`, because the decorator is JSX.

## For AI Agents

### Working In This Directory

1. **Stories are co-located with components** under `src/` — Storybook glob picks them up automatically.
2. **A11y addon is mandatory.** Stories without a11y assertions are a code-review red flag.
3. **`pnpm storybook`** runs on port 6006; `pnpm build-storybook` produces a static build.

## Dependencies

### External

- `storybook`, `@storybook/react-vite`, `@storybook/addon-a11y`.

<!-- MANUAL: -->
