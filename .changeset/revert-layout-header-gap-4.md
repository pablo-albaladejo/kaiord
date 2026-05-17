---
"@kaiord/workout-spa-editor": patch
---

Revert accidental `gap-4` addition on LayoutHeader's inner flex container introduced as a drive-by in #632. The class shifts the header layout and breaks the `coaching-sidebar-mobile.png` visual snapshot at 768px, blocking every downstream PR.
