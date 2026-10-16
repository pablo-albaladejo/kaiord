---
"@kaiord/workout-spa-editor": patch
---

Programmatic scrolls now jump instead of gliding. The global `html { scroll-behavior: smooth }` moved the page under a press that had already started, so the release landed on another element and the press was lost. Callers that want a glide ask for it per call and respect reduced motion.
