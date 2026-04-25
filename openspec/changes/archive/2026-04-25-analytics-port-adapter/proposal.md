> Completed: 2026-04-25

## Why

Kaiord has no visibility into who visits kaiord.com or uses the editor. Adding analytics following the existing Logger port/adapter pattern makes tracking opt-in by design: OSS consumers inject nothing (or a noop), while Kaiord's own deployments inject a Cloudflare Web Analytics adapter — consistent with the "your data never leaves your device" privacy message.

## What Changes

- New `Analytics` port in `@kaiord/core` (`pageView`, `event`) mirroring the existing `Logger` port
- New `noopAnalytics` adapter in `@kaiord/core` (default: no tracking)
- New `cloudflareAnalytics` adapter in `@kaiord/landing` (vanilla TS, wraps `window.cfBeacon`)
- New `cloudflareAnalytics` adapter in `@kaiord/workout-spa-editor` (React, wraps `window.cfBeacon`)
- `AnalyticsProvider` + `useAnalytics()` React hook in the editor for context-based injection
- Cloudflare beacon `<script>` tag added to `landing/index.html` and `workout-spa-editor/index.html`
- Token/site ID sourced from env vars (`VITE_CF_ANALYTICS_TOKEN` for editor, build-time substitution for landing)
- Landing tracks: page view on load, `editor-opened` on CTA click, `github-opened` on GitHub link click
- Editor tracks: `editor-loaded`, `workout-generated`, `workout-exported`, `garmin-synced`

## Capabilities

### New Capabilities

- `analytics-port`: Analytics port and noop adapter in `@kaiord/core` — the contract any analytics implementation must satisfy

### Modified Capabilities

<!-- No existing spec-level behaviors change. This is purely additive infrastructure. -->

## Impact

- **Packages touched**: `@kaiord/core` (port + noop adapter), `@kaiord/landing` (adapter + wiring), `@kaiord/workout-spa-editor` (adapter + provider + hook + wiring)
- **Hexagonal layers**: ports (new `Analytics` type), adapters (cloudflare implementations), application (no change)
- **Public API**: `Analytics` type and `createNoopAnalytics` exported from `@kaiord/core` — additive, no breaking changes
- **No new published packages**: Cloudflare adapters are private to each consumer package (YAGNI)
- **No cookies, no consent banner**: Cloudflare Web Analytics is cookieless and GDPR-compliant by default
