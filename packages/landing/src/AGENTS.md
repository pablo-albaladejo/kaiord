<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/ AGENTS.md

## Purpose

TypeScript source files for the landing page. Includes the main entry point, CSS imports, analytics setup, and adapter implementations. All code is client-side (browser environment via Vite).

## Key Files

- **`main.ts`** (9 LOC) — Entrypoint. On `DOMContentLoaded` calls `setupInstallWidget()`, `setupSmoothScroll()` and `setupAnalytics()`.
- **`install-widget.ts`** (101 LOC) — Developer install widget: package-manager tabs (WAI-ARIA roving tabindex, arrow keys), mobile `<select>` mirror, copy button, and smooth scrolling.
- **`main.css`** (86 LOC) — Tailwind directives + custom animations. Imports brand tokens. Defines fade-in-left, fade-in-right, pulse-slow animations. Unified focus-visible ring styling.
- **`analytics.ts`** (5 LOC) — Creates Umami analytics client, conditionally noop.
- **`setup-analytics.ts`** (36 LOC) — Wires up analytics: pageView on load, click handlers for editor/docs/github links, and `extension-install-clicked` (`{ extension: <listing slug> }`) on Chrome Web Store links.

## Subdirectories

- **`adapters/`** — Analytics adapter implementations.
- **`types/`** — TypeScript declarations (Umami tracker types).

## For AI Agents

### Working In This Directory

- **Vite entrypoint** — `main.ts` is imported in `index.html` as a module script. CSS is imported within `main.ts`.
- **Browser environment** — all code runs in jsdom (tests) or real browser. Access DOM via `document.*` and `window.*`.
- **No imports from external packages except @kaiord/core** — keep dependencies minimal.
- **Max 100 LOC per file** — enforce via linter. Break large files into separate adapters or utilities.

### Testing Requirements

- **jsdom + vitest** — DOM tests in `adapters/analytics/umami-analytics.test.ts`.
- **AAA pattern** — every test must have `// Arrange`, `// Act`, `// Assert`.
- **Titles start with "should "** — enforced at IDE and pre-commit.
- **Mocking `window` objects** — use `Object.defineProperty()` to mock `window.umami`.

### Common Patterns

- **Import CSS** — `import "./main.css"` at top of `main.ts`.
- **Query DOM elements** — use `document.getElementById()`, `document.querySelectorAll()` with type assertions.
- **Event listeners** — `addEventListener()` with proper cleanup (not required here; page reloads).
- **Conditional execution** — check `typeof window !== "undefined"` before accessing browser APIs.

## Dependencies

### Internal

- `@kaiord/core` — `Analytics`, `AnalyticsEvent`, `createNoopAnalytics`.
- `../../../styles/brand-tokens.css` — shared design tokens (colors, fonts).

### External

- **Tailwind CSS** — via `@import "tailwindcss"` in CSS.
- **Vite client types** — via `tsconfig.json` types array.

## Notes

- **Brand tokens** — defines the ramp and role layers (`--bg-page`, `--text`, `--border`, `--control`, `--mkt-brand`, …). Loaded from the shared workspace resource, not packaged with landing. The landing is the ONE surface allowed to reference the `--mkt-*` marketing roles; `scripts/check-mkt-boundary.mjs` fails `pnpm lint` if any other file does.
- **Analytics fallback** — if Umami tracker unavailable, errors are caught and suppressed (never surfaces to app).
- **Smooth scroll behavior** — respects `prefers-reduced-motion` media query; disables animations if user preference set.

<!-- MANUAL: -->
