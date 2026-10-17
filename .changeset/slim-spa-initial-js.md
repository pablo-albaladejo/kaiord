---
"@kaiord/workout-spa-editor": patch
---

Slim the SPA's initial JS by ~20.9 kB gzip (300.4 → 279.5 kB) without changing behaviour: the editor keyboard shortcuts (and the workout store they drag in), the Train2Go zones-conflict dialog, the zones-sync and coaching use cases, and the header's week-zone classifier now load on first use instead of at boot, and lucide icons are no longer forced into one shared chunk.
