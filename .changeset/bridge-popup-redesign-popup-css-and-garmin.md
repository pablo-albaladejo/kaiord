---
"@kaiord/garmin-bridge": minor
---

Redesign the Garmin bridge popup as an identity card. Drops the `Check Session` and `List Workouts` buttons; auto-fetches on open with bounded per-phase timeouts (snapshot 1 s, ping 3 s); the Retry affordance only appears on user-resolvable failures. Renders the athlete card from the cached `profileSnapshot` (FTP, threshold pace, LTHR, max HR, weight, active sport) with a `prefers-reduced-motion`-aware loading skeleton, "Updated <relative time>" line, distinct stale/empty/no-snapshot placeholders, and a 0/1/≥2 field-count rendering rule. The header is a 3-column grid with a reserved 16×16 slot for a refresh-icon button — `visibility: hidden` during loading and on the failure path so the title row never reflows. CTA hierarchy enforces a single primary "Open editor" button + a secondary "Open Garmin Connect" link.

Shared structural CSS lives at `packages/_shared/popup/popup.css`; `pnpm popup:sync` copies it byte-for-byte into the bridge, and `scripts/check-popup-css-parity.test.mjs` fails the lint job if either copy drifts.
