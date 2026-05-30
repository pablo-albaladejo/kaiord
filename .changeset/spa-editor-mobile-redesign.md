---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): mobile-first redesign — Athlete, AI-first Create, Today, Workout Detail, Library, Settings, bottom nav

A ground-up mobile redesign of the editor app, built on the existing dark-slate and sky design system with a new 5-zone training color ramp (`--zone-1..5`).

- **Athlete** (`/athlete`): Profile is promoted out of Settings into a single top-level page — identity, a sport selector that recomputes thresholds plus a derived 5-zone map, and a **Connections** section that merges Linked Accounts with Data Flows into human per-connection sync toggles backed by live integration policies. `/settings/profile` redirects to `/athlete`.
- **Create**: an AI-first "New session" overlay (input → generating → review) that generates a workout via the configured AI provider with the active sport's zones injected, then Save and push persists it and pushes to Garmin.
- **Today** (`/calendar`): a morning landing with a readiness card (HRV/sleep from the health stores, graceful empty states), a week-load strip, and a planned-session card. The full week calendar stays at `/calendar/:weekId`.
- **Workout Detail** (`/workout/view/:id`) with a one-tap 3-state Push button.
- **Library**: reskinned to a mobile card list with search and sport filters.
- **Settings**: flattened into a grouped iOS-style list.
- **Navigation**: a responsive floating bottom nav and center FAB on mobile; the desktop chrome is unchanged.

New design-system atoms (Toggle, Segmented, Pill), viz primitives (ZoneMap, ZoneDist, ReadinessRing, AvatarRing, StepList, SummaryStrip, Metric, SectionHead), and derivation libs (`lib/athlete`, `lib/workout-review`).
