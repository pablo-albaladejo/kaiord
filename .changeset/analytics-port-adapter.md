---
"@kaiord/core": patch
---

Add Analytics port and noop adapter.

Introduces `Analytics` type and `AnalyticsEvent` alias as a new port in `@kaiord/core`, alongside `createNoopAnalytics()` as the default do-nothing adapter. OSS consumers receive a zero-dependency, zero-tracking default; private deployments can inject their own adapter (e.g. Cloudflare Web Analytics) without any code changes to the framework.
