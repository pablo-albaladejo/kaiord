---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/whoop-bridge": patch
---

Ship English-only extension UI: remove the `_locales/es` (Spanish) locale from
the Garmin, Train2Go, and Whoop bridges so every bridge exposes a single,
audited English surface — matching each manifest's `default_locale: "en"`. A
new `scripts/check-bridge-locales-english-only.test.mjs` guard (run under
`test:scripts`) now fails CI if any `packages/*-bridge/_locales/` reintroduces a
non-`en` locale.
