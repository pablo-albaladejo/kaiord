# Primary Nav: Tab Bar over Sidebar

**Status:** Accepted
**Date:** 2026-05-24
**Scope:** `add-health-metrics-to-krd` §7

## Decision

The Training / Health / Settings primary navigation ships as a **horizontal
tab bar** mounted inside `MainLayout`, between `LayoutHeader` and the route
outlet. A sidebar is explicitly rejected.

## Context

KRD v2.0 introduces the Health Hub as a peer of the existing Training
surface. The SPA needs a primary navigation that scales to three top-level
destinations (Training, Health, Settings) without disrupting the existing
calendar/library/editor flow.

## Forces

- Today's app has a single header and no chrome between header and route
  body. Adding a sidebar means a full layout overhaul (grid template, focus
  order, route announcer reposition).
- Mobile is a first-class breakpoint (per `vitest.config.ts` Mobile Chrome
  e2e project). On mobile a collapsed sidebar becomes a hamburger overlay
  modal — two extra taps to switch surfaces.
- Three labels with short text (Training / Health / Settings) fit
  comfortably as tabs at every breakpoint we ship (≥320 px). A sidebar
  would waste horizontal real estate at ≥1024 px and require a media-query
  collapse at <768 px.
- Existing `Settings` is a routed page at `/settings/ai` (header button
  navigates there). The tab bar links to the same route, so the "Settings"
  tab matches existing user mental model.
- Tab bars match iOS / Android primary-nav conventions; users coming from
  health apps (Garmin Connect, Strava) expect bottom-tabbed or top-tabbed
  health vs training partition.

## Consequences

- New file `PrimaryNav.tsx` mounted in `MainLayout` between header and the
  route outlet. ~60 line component cap holds.
- Active-tab indication is the existing focus-ring + a 2 px bottom border
  in the brand colour; no separate visual treatment per breakpoint.
- Future fourth top-level destination would force a re-evaluation. With
  three items the tab bar is a clear win; at five+ items a sidebar becomes
  competitive.
- Clicking the active tab is a no-op (no extra route change, no scroll
  reset).
- Settings tab navigates to `/settings/ai` (same target as the existing
  header button). The Settings tab shows as "active" whenever the URL is
  under `/settings/*`.

## Alternatives considered

- **Sidebar.** Rejected — layout overhaul too invasive for a three-item
  nav, mobile experience worse, more focus-order complexity.
- **Bottom tab bar (mobile only).** Rejected — adds a second nav location
  that the desktop has to either duplicate or hide. Single nav location
  across breakpoints is simpler.
- **Burger + drawer.** Rejected — adds latency to every nav action
  (one extra tap), and our nav has only three destinations.
