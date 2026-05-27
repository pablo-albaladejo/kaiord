---
"@kaiord/core": minor
"@kaiord/workout-spa-editor": minor
"@kaiord/mcp": minor
---

feat(core): introduce MANAGED_DATA_REGISTRY single-source-of-truth for kaiord-managed data kinds; add deterministic external-id hash projection; tighten ManualHealthMetric and HealthKrdType to derive from ManagedDataType.

Foundational for the integration-policy-per-profile-routing feature (PR 1 of 7). No runtime behavior change yet — subsequent PRs wire policy resolution, Dexie migration, and the Data Flows UI on top of this registry.
