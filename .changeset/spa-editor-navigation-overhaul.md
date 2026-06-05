---
"@kaiord/workout-spa-editor": patch
---

Navigation consistency overhaul

A single pass that makes in-app navigation predictable end to end. Create flows entered from a calendar day now schedule the workout onto **that** day (AI, scratch and import alike) instead of silently defaulting to today, and the scratch surface persists to the calendar rather than only exporting a file. The Athlete "Create profile" empty state opens the profile dialog in place instead of bouncing through a dead `/settings/profile` redirect, and the header "Settings" entry now opens the settings index (matching the mobile tab) rather than jumping into the AI sub-tab. Back/close actions are origin-aware via a shared `?from=` contract, so leaving the editor, a workout, or a detail view returns to where the user came from instead of a hardcoded default. Today gains a tappable week strip and a "Trends →" card; the desktop header gains active-state/`aria-current` and an Athlete entry; settings-index rows deep-link to and focus the named section. Accessibility is tightened too: route-announcer labels are corrected (Athlete and the read-only workout view no longer announce as "Calendar"/"Edit"), and every route renders a stable, focusable heading from first paint. Dead, route-unmounted picker code is removed.
