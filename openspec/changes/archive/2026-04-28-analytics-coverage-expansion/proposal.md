> Completed: 2026-04-28

## Why

The `analytics-port-adapter` change wired up the Analytics port but only tracked four coarse events in the editor (`editor-loaded`, `workout-generated`, `workout-exported`, `garmin-synced`). SPA route changes, file imports, manual workout creation, and render errors are invisible to the dashboard, leaving the majority of user interactions untracked.

## What Changes

- `analytics.pageView(path)` fired on every wouter route change in the editor (SPA tracking)
- `workout-imported` event fired on successful file import (FIT, TCX, ZWO, KRD, GCN) with `{ format }` prop
- `workout-created` event fired when a manual (non-AI) workout is saved with `{ source: "manual" }` prop
- `route-error` event fired in `RouteErrorBoundary.componentDidCatch` with `{ route }` prop
- `RouteErrorBoundary` accepts `analytics` as an optional prop (injected from `App.tsx`)

## Capabilities

### New Capabilities

<!-- No new spec-level capabilities. All additions are within the existing analytics-port contract. -->

### Modified Capabilities

- `analytics-port`: Extend accepted event names and props documented in the spec to include the four new events (`pageView` for SPA routes, `workout-imported`, `workout-created`, `route-error`).

## Impact

- **Packages touched**: `@kaiord/workout-spa-editor` only
- **Hexagonal layers**: adapters (wiring) and application components — no port changes
- **Public API**: no breaking changes; `Analytics` type in `@kaiord/core` is unchanged
- **No new packages, no new dependencies**
