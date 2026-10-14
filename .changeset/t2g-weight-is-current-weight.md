---
"@kaiord/workout-spa-editor": patch
---

The Train2Go zones sync treats the athlete's weight as the current weight: it compares Train2Go's weight with the latest weigh-in (else the profile weight) and records an incoming weight as a Train2Go weigh-in for today, stamped with the Train2Go bridge as its source, instead of writing the profile's weight. A manual weigh-in of the same day is kept, and re-syncing a weight Train2Go already reported records nothing.
