---
"@kaiord/workout-spa-editor": patch
---

The app now honours the OS "reduce motion" setting (WCAG 2.3.3). Under `prefers-reduced-motion: reduce` the page no longer scrolls smoothly, the light/dark theme change no longer fades, dialog and menu enter/exit animations are shortened to near zero, and the coach-mark scroll jumps straight to its target. Without the setting, nothing changes.
