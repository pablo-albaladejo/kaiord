---
"@kaiord/workout-spa-editor": patch
---

Introduce the `--action` product role and the `cta` button variant. Magenta reaches the product for the first time, but only as a role: `--action`/`--action-ink`/`--action-hover` declared in both theme blocks of `styles/brand-tokens.css` (mg-600 over light, mg-400 over dark — the same ramp steps marketing's CTA uses, pinned by test so the two can never drift), mapped into the Tailwind theme, and consumed by a new `cta` Button variant reserved for a surface's single primary action. `primary` and its call sites stay neutral.
