---
"@kaiord/workout-spa-editor": patch
---

Adopt the now theme-adaptive shared brand tokens: `styles/brand-tokens.css`
carries light defaults on `:root` with the original dark palette under
`.dark`, so the editor's semantic surface/ink/edge tokens alias brand tokens
directly instead of re-declaring per-theme hex values. No visual change in
either theme; landing stays pinned dark via a static `dark` class and the
docs' Node-side token readers now resolve the dark brand identity explicitly.
