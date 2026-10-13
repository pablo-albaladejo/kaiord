> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. `updateSportThresholds` merges an updater at write time and seeds a missing config (red first: concurrent patches lost one, a missing config threw).
- [x] 2. Tagline names only sports with a threshold (red first).
- [x] 3. Inline threshold fields on `/athlete` with commit on blur/Enter, validation, "Saved" and max HR; dialog removed.
- [x] 4. `/athlete/zones/:sport` page: tab ↔ URL, unknown sport redirect, read-only summary, generic LTHR; sports without config keep their tabs (red first).
- [x] 5. Profile Manager without a zones tab (red first); route announcer and analytics redaction know the route.
- [x] 6. E2E and verify:prod migrated: profiles, profile-zones-es, new athlete-zones-page; F-24, F-25, F-46b, i18n scan, P-19.
