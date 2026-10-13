> Completed: 2026-10-13

# Proposal: Connections as the single home

## Why

External accounts had three homes (audit findings P-07, P-09, P-14):

- **P-14** — Settings → Connections managed the sources in this browser, while
  the profile manager's Linked Accounts tab managed the Train2Go link stored on
  the athlete. Same concept, two places, two sets of rules, and neither said
  which data lived where.
- **P-09** — the Settings row counted only the five extensions ("0 of 5
  detected") beside a page of seven cards: intervals.icu, connected by API key,
  could never be counted.
- **P-07** — the Athlete page linked to Connections only when a Train2Go
  account was linked, so an athlete fed by Garmin alone had no way from their
  page to their sources.

## What Changes

- Connections becomes a page of its own at `/connections` (lazy-loaded), out of
  Settings. `/settings/connections`, `/settings/extensions` and
  `/settings/data-hub` redirect to it with history replace; `/settings/profile`
  moves into the same retired-section table and still lands on `/athlete`.
- The Settings rail and index drop Connections. The Settings attention banner
  now carries an "Open connections" action, since the rail can no longer reach
  the place the attention is fixed.
- The page opens with a scope statement — "Ana's connections · in this
  browser", they don't sync to other devices — and a count of every connected
  source the cards render, API-key ones included, gated on discovery.
- The profile manager loses its Linked Accounts tab. The Train2Go card states
  an existing link ("saved with the athlete, not just in this browser") and
  offers Unlink, even when the extension is absent.
- The Athlete page always shows a link to Connections, with a chip per source
  feeding the athlete: connected in this browser, or linked on the profile.
- Every `/settings/connections` link in the app (status pill, send-week
  preflight, placement feedback, editor ribbon, first-run steps, nav rows)
  points to `/connections`.

## Impact

- Specs: `spa-settings-shell`, `spa-connections-page`, `spa-train2go-extension`,
  `spa-coaching-integration`, `spa-calendar`, `spa-garmin-extension`,
  `spa-whoop-extension`, `spa-persistence-port`; `athlete-connections` purpose.
- Data: none. `profile.linkedAccounts` and the device-local `connections` table
  are unchanged; only where they are shown and managed moves.
