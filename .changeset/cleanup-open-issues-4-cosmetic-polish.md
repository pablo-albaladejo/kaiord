---
"@kaiord/workout-spa-editor": patch
---

chore(spa-editor): cosmetic polish bundle (closes #266, #267, #268, #269, #270)

- Remap `gray-*` utilities to `slate-*` via the Tailwind 4 `@theme` alias block — every `bg-gray-*`, `text-gray-*`, `border-gray-*`, etc. now resolves through `var(--color-slate-*)` without touching the ~90 call sites individually.
- Add `size-adjust: 100%` to the Inter `@font-face` declaration across all three surfaces (landing, docs, editor) to eliminate Cumulative Layout Shift on first paint.
- Unify `:focus-visible` ring across landing / docs / editor surfaces so a keyboard user sees the same indicator everywhere.
- Add `viewport-fit=cover` to the SPA's viewport meta and reserve `safe-area-inset-{left,right,bottom}` on the body so notch / rounded-corner devices do not crop SPA content.
- Document the shared `@font-face` invariant (unicode-range / font-weight / size-adjust must stay byte-equal across the three surface CSS files; only the `src:` URL differs by Pages base path).
