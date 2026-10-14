---
"@kaiord/workout-spa-editor": patch
---

The Train2Go zones sync treats the athlete's weight as the current weight: it compares Train2Go's weight with the latest weigh-in (else the profile weight) and records an incoming weight as today's weigh-in instead of writing the profile's weight. Re-syncing the same weight records nothing.
