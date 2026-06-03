# Handoff: Kaiord Landing Redesign

## Overview

A redesign of the marketing landing at **kaiord.com** (`packages/landing`). The current page has an
**identity crisis** — it mixes a consumer message ("create & sync workouts") with a developer message
("TypeScript framework, `npm i @kaiord/core`") and a visitor can't tell whether Kaiord is an **app to try**
or a **library to install**. This redesign resolves that with an **explicit audience fork** (direction "B",
chosen from three hero options) and a clear page structure that serves both paths without blurring them.

It also fixes secondary issues found in review:

- The hero was text-only — no product visual. The redesign **shows the editor** (a real device mockup).
- "100% AI-coded" was over-weighted (hero badge + full card) — it's **demoted to one honest line** near open-source.
- The format-hub diagram showed the same 4 formats mirrored left/right (read as redundant) — it's **redesigned as a radial hub** with KRD at the center and bidirectional connectors.
- Vanity metrics ("0 lint warnings") are **replaced** with ones that sell (5 adapters, 100% round-trip, MIT, 0 backend services).

## About the Design Files

The files here are a **runnable design reference** built in React + inline styles (Babel in-browser). They are
**not the production code to paste in.** The real landing is a \*\*single hand-authored `index.html` + Tailwind v4

- the shared `styles/brand-tokens.css`**, zero framework, static-built by Vite. The task is to **rebuild
  `packages/landing/index.html` to match this design\*\* using that same approach:

* Inline `style={{…}}` → Tailwind v4 utilities + the existing `var(--brand-*)` tokens (already imported via `src/main.css`).
* Keep it framework-free: semantic HTML + a tiny vanilla JS island for the install-command tabs / copy button
  (the repo already has `src/main.ts` doing exactly this — extend it, don't add React).
* Reuse the existing animation utilities in `src/main.css` (`animate-fade-in-*`, `pulse-slow`) and the
  `prefers-reduced-motion` + unified `:focus-visible` blocks already present.
* Preserve all the good accessibility already in the current page: skip-to-content link, ARIA on the diagram,
  `min-h-[44px]` touch targets, focus rings.

## Fidelity

**High-fidelity** on color, type, spacing, and structure — values below are exact and all map to existing brand
tokens. The device mockup in the hero/showcase is a **representation of the editor** (the same product we
redesigned in the app handoff) — when implementing, use a **real screenshot or a lightweight CSS mock**, not a
pixel-copy of the React mockup.

## Design Tokens

Everything maps to `styles/brand-tokens.css` (no new tokens needed — the 5-zone ramp `--zone-1..5` and
`--brand-bg-deep` already exist there):

| Role                                           | Token                                            | Value                                     |
| ---------------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Page bg                                        | `--brand-bg-primary`                             | `#0f172a`                                 |
| Deep bg (mock screens)                         | `--brand-bg-deep`                                | `#0b1220`                                 |
| Card surface                                   | `--brand-bg-surface`                             | `#1e293b`                                 |
| Elevated                                       | `--brand-bg-elevated`                            | `#334155`                                 |
| Border                                         | `--brand-border`                                 | `#334155`                                 |
| Text primary / sec / muted                     | `--brand-text-primary` / `-secondary` / `-muted` | `#f8fafc` / `#cbd5e1` / `#94a3b8`         |
| Accent (CTAs, links)                           | `--brand-accent-blue`                            | `#0284c7`                                 |
| Accent bright (on-dark headline accent, icons) | sky-400                                          | `#38bdf8`                                 |
| Accent soft (pill bg)                          | `--brand-accent-blue-soft`                       | `#0c4a6e`                                 |
| Developer accent                               | `--brand-accent-purple`                          | `#9333ea`                                 |
| Success / sync                                 | `--brand-semantic-tip`                           | `#34d399`                                 |
| Zone ramp Z1–Z5                                | `--zone-1..5`                                    | `#64748b #0ea5e9 #22c55e #f59e0b #ef4444` |

Type: **Inter** (`--brand-font-sans`), mono `--brand-font-mono`. Headings 800–850 weight, `-0.02–0.03em`
tracking. Hero h1 ~56px desktop / 40px mobile. Section h2 ~40 / 30. Radii: cards 22px, code/inputs 12–13px,
pills 999px. Section padding 88px desktop / 56px mobile, max-width 1180.

## Page structure (top → bottom)

1. **Sticky nav** — logo + links (Features, Docs, Developers, Open Source, GitHub) + "Try the Editor" CTA.
   Mobile collapses to logo + Docs + CTA. (Same as today, restyled.)
2. **Hero — the audience fork** _(the core change)_. Centered eyebrow + `One framework. / Every fitness format.`
   - sub "Whether you train or you build — pick your path." Then **two equal path cards**:
   * **For athletes → "Use the editor"** (sky accent): copy + an **editor device mockup**, primary CTA "Open the Editor".
   * **For developers → "Build with the SDK"** (purple accent): copy + the `convert.ts` code block + an
     `npm i @kaiord/core` row. Soft CTA "Read the Docs".
     Cards sit side-by-side on desktop, stack on mobile.
3. **Showcase (athletes)** — `id="features"`. Eyebrow "For athletes" + h2 "Plan, generate, sync." Then a
   **show band**: editor mockup beside 3 feature rows — _Visual workout editor_, _AI workout generation_,
   _One-tap Garmin sync_. (Reuses current feature copy.)
4. **Format hub** — h2 "One hub. Every format." A **radial diagram**: `KRD` hub centered, `.FIT .TCX .ZWO .GCN`
   at N/W/E/S, bidirectional connectors (`↕`/`↔`). Caption "lossless and round-trip safe."
5. **Developers** — `id="developers"`. Eyebrow "For developers" + h2 "Convert fitness data in 4 lines." A
   **working install widget** (npm/yarn/pnpm/bun tabs + copy button — port the existing `main.ts` behavior),
   the `convert.ts` code block, then a **6-item capability grid** (TS-first, Hexagonal, Plugin system, CLI,
   MCP server, 5 format adapters).
6. **Differentiators** — one prominent **"Zero infrastructure"** card (No servers / accounts / cloud + chips
   CLI · SPA editor · MCP · Browser extension), followed by a **single demoted line**: "Every line … written by
   AI agents. → See the commits".
7. **Open source** — `id="open-source"`. h2 "Built in the open." 4 stat cards (5 / 100% / MIT / 0) + "Star on GitHub".
8. **Footer** — logo + GitHub/npm/MIT + "Built by Pablo Albaladejo" + cookieless-analytics note.

## Interactions

- **Install widget**: clicking a package-manager tab swaps the command text; copy button writes to clipboard and
  shows a check for ~1.4s. (The repo's `src/main.ts` already implements tabs + copy + a mobile `<select>` — keep that.)
- **Smooth scroll** for in-page anchors; **`prefers-reduced-motion`** disables animations (both already in `main.css`).
- Hub diagram + format chips animate in (reuse `animate-fade-in-*`); KRD hub uses the existing `pulse-slow`.

## Responsive

Mobile-first. Breakpoint used in the reference is **~860px**: hero cards stack, showcase phone+features stack,
capability grid → 1 column, stats grid → 2 columns, nav collapses. Use Tailwind's `sm:`/`md:`/`lg:` to match.

## Files in this bundle

- `Kaiord Landing.html` — the full redesigned landing (entry). Open to run.
- `Landing Hero Variants.html` — the 3 hero directions on a comparison canvas (A product-first, **B audience fork ← chosen**, C show-dominant). Kept for context.
- `kl.jsx` — landing tokens (exact brand values), Kaiord logo, icons, atoms (`LBtn`, `Badge`), and the
  `EditorPhone` mockup.
- `heroes.jsx` — the 3 hero variants + shared `ForkCard` and `CodeBlock`.
- `landing-sections.jsx` — the full responsive page: `Nav`, `Hero` (fork), `Showcase`, `FormatHub`,
  `Developers` (+ `InstallWidget`), `Differentiators`, `OpenSource`, `Footer`, and the `useMobile` hook.

> Implementation target: `packages/landing/index.html` (+ minor `src/main.ts` / `src/main.css` additions).
> The design canvas / variant files are reference only.
