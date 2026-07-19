---
"@kaiord/docs": patch
---

Fix the docs theme-color helper reading the light `:root` value instead of
the dark palette: `extractDarkBlock` matched a `.dark { … }` reference inside
a comment (capturing an ellipsis) rather than the real `.dark` rule, so it
silently fell back to `:root`. Anchor the selector to the start of a line.
The brand-tokens tests (which pin the dark-first theme-color) pass again.
